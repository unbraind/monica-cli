import { spawnSync } from 'node:child_process';

interface PageInfo { hasNextPage: boolean; endCursor: string | null }
interface Connection<T> { pageInfo: PageInfo; nodes: T[] }
interface ReactionNode { content: string; user: { login: string } | null }
interface CommentNode {
  id: string;
  url: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: { login: string } | null;
  reactions: ReactionNode[];
}
interface ReviewNode {
  id: string;
  url: string;
  state: string;
  body: string;
  submittedAt: string;
  author: { login: string } | null;
  reactions: ReactionNode[];
}
interface ThreadNode {
  id: string;
  isResolved: boolean;
  isOutdated: boolean;
  path: string;
  line: number | null;
  comments: { nodes: CommentNode[] };
}
type RawCommentNode = Omit<CommentNode, 'reactions'> & { reactions: { nodes: ReactionNode[] } };
type RawReviewNode = Omit<ReviewNode, 'reactions'> & { reactions: { nodes: ReactionNode[] } };
type RawThreadNode = Omit<ThreadNode, 'comments'> & { comments: { nodes: RawCommentNode[] } };
interface PullRequestPage {
  id: string;
  number: number;
  url: string;
  title: string;
  state: string;
  headRefOid: string;
  comments: Connection<CommentNode>;
  reviews: Connection<ReviewNode>;
  reviewThreads: Connection<ThreadNode>;
}

const INVENTORY_QUERY = `query($owner:String!,$repo:String!,$number:Int!,$commentsCursor:String,$reviewsCursor:String,$threadsCursor:String){
  repository(owner:$owner,name:$repo){pullRequest(number:$number){
    id number url title state headRefOid
    comments(first:100,after:$commentsCursor){pageInfo{hasNextPage endCursor} nodes{id url body createdAt updatedAt author{login} reactions(first:20){nodes{content user{login}}}}}
    reviews(first:100,after:$reviewsCursor){pageInfo{hasNextPage endCursor} nodes{id url state body submittedAt author{login} reactions(first:20){nodes{content user{login}}}}}
    reviewThreads(first:100,after:$threadsCursor){pageInfo{hasNextPage endCursor} nodes{id isResolved isOutdated path line comments(first:50){nodes{id url body createdAt updatedAt author{login} reactions(first:20){nodes{content user{login}}}}}}
  }}}
}`;

/** Run a command and return its standard output or fail with actionable context. */
function run(command: string, args: string[], input?: string): string {
  const result = spawnSync(command, args, { encoding: 'utf8', input });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${result.stderr.trim()}`);
  }
  return result.stdout;
}

/** Execute a GitHub GraphQL request with typed variables. */
function graphQl(query: string, variables: Record<string, string>): Record<string, unknown> {
  const args = ['api', 'graphql', '-F', 'query=@-'];
  Object.entries(variables).forEach(([name, value]) => args.push('-F', `${name}=${value}`));
  return JSON.parse(run('gh', args, query)) as Record<string, unknown>;
}

/** Normalize nested GraphQL reaction connections into stable arrays. */
function normalizeReactions<T extends { reactions: { nodes: ReactionNode[] } }>(node: T): Omit<T, 'reactions'> & { reactions: ReactionNode[] } {
  return { ...node, reactions: node.reactions.nodes };
}

/** Resolve the current repository and pull request from the checked-out branch. */
function currentPullRequest(): { owner: string; repo: string; number: number } {
  const payload = JSON.parse(run('gh', ['pr', 'view', '--json', 'number,headRepository,headRepositoryOwner'])) as {
    number: number;
    headRepository: { name: string };
    headRepositoryOwner: { login: string };
  };
  return { owner: payload.headRepositoryOwner.login, repo: payload.headRepository.name, number: payload.number };
}

/** Fetch every comment, review, and inline thread with independent pagination. */
function inventory(): void {
  const reference = currentPullRequest();
  const comments: CommentNode[] = [];
  const reviews: ReviewNode[] = [];
  const threads: ThreadNode[] = [];
  let commentsCursor = '';
  let reviewsCursor = '';
  let threadsCursor = '';
  let metadata: Omit<PullRequestPage, 'comments' | 'reviews' | 'reviewThreads'> | null = null;
  do {
    const variables: Record<string, string> = { owner: reference.owner, repo: reference.repo, number: String(reference.number) };
    if (commentsCursor) variables.commentsCursor = commentsCursor;
    if (reviewsCursor) variables.reviewsCursor = reviewsCursor;
    if (threadsCursor) variables.threadsCursor = threadsCursor;
    const response = graphQl(INVENTORY_QUERY, variables) as {
      data: { repository: { pullRequest: Omit<PullRequestPage, 'comments' | 'reviews' | 'reviewThreads'> & {
        comments: Connection<RawCommentNode>;
        reviews: Connection<RawReviewNode>;
        reviewThreads: Connection<RawThreadNode>;
      } } };
    };
    const page = response.data.repository.pullRequest;
    metadata ??= { id: page.id, number: page.number, url: page.url, title: page.title, state: page.state, headRefOid: page.headRefOid };
    comments.push(...page.comments.nodes.map(normalizeReactions));
    reviews.push(...page.reviews.nodes.map(normalizeReactions));
    threads.push(...page.reviewThreads.nodes.map((thread) => ({
      ...thread,
      comments: { nodes: thread.comments.nodes.map(normalizeReactions) },
    })));
    commentsCursor = page.comments.pageInfo.hasNextPage ? (page.comments.pageInfo.endCursor ?? '') : '';
    reviewsCursor = page.reviews.pageInfo.hasNextPage ? (page.reviews.pageInfo.endCursor ?? '') : '';
    threadsCursor = page.reviewThreads.pageInfo.hasNextPage ? (page.reviewThreads.pageInfo.endCursor ?? '') : '';
  } while (commentsCursor || reviewsCursor || threadsCursor);
  const checks = JSON.parse(run('gh', ['pr', 'checks', String(reference.number), '--json', 'name,state,link,bucket'])) as unknown;
  process.stdout.write(`${JSON.stringify({ pullRequest: metadata, comments, reviews, threads, checks }, null, 2)}\n`);
}

/** Execute an explicit feedback acknowledgement or thread lifecycle mutation. */
function mutate(operation: string, nodeId: string, value?: string): void {
  const definitions: Record<string, { query: string; requiresValue?: boolean }> = {
    react: {
      query: 'mutation($id:ID!,$value:ReactionContent!){addReaction(input:{subjectId:$id,content:$value}){reaction{content user{login}}}}',
      requiresValue: true,
    },
    'reply-thread': {
      query: 'mutation($id:ID!,$value:String!){addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$id,body:$value}){comment{id url}}}',
      requiresValue: true,
    },
    'resolve-thread': {
      query: 'mutation($id:ID!){resolveReviewThread(input:{threadId:$id}){thread{id isResolved}}}',
    },
    comment: {
      query: 'mutation($id:ID!,$value:String!){addComment(input:{subjectId:$id,body:$value}){commentEdge{node{id url}}}}',
      requiresValue: true,
    },
  };
  const definition = definitions[operation];
  if (!definition) throw new Error(`Unknown operation: ${operation}`);
  if (definition.requiresValue && !value) throw new Error(`${operation} requires a value`);
  const variables: Record<string, string> = { id: nodeId };
  if (value) variables.value = value;
  process.stdout.write(`${JSON.stringify(graphQl(definition.query, variables), null, 2)}\n`);
}

/** Dispatch the review-loop command. */
function main(): void {
  const [operation = 'inventory', nodeId, value] = process.argv.slice(2);
  if (operation === 'inventory') {
    inventory();
    return;
  }
  if (!nodeId) throw new Error(`Usage: bun scripts/pr-review-loop.ts ${operation} <node-id> [value]`);
  mutate(operation, nodeId, value);
}

main();
