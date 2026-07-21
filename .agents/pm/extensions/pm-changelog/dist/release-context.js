import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
export const MISSING_TAG_HISTORY_ERROR_CODE = "E_MISSING_TAG_HISTORY";
const TAG_HISTORY_RECOVERY_COMMANDS = ["git fetch --tags --unshallow", "git fetch --tags"];
/**
 * Structured diagnostic raised when tag-derived release windows are requested
 * from a checkout whose git tag history is incomplete. Carries a stable
 * machine-readable `code` plus the recovery commands so agents and CI logs can
 * distinguish "missing git context" from "stale generated content".
 */
export class MissingTagHistoryError extends Error {
    code = MISSING_TAG_HISTORY_ERROR_CODE;
    /**
     * Machine-readable list of recovery commands. Each entry is a single
     * independently-executable shell command; consumers run them in the listed
     * order. Entries are deliberately NOT compound `&&` expressions so callers
     * that execute each element discretely (CI bots, agents) still get a valid
     * command. The human-readable `message` may embed the inline `&&` form for
     * copy-paste convenience.
     */
    recoveryCommands;
    constructor(message, recoveryCommands = TAG_HISTORY_RECOVERY_COMMANDS) {
        super(message);
        this.name = "MissingTagHistoryError";
        this.recoveryCommands = recoveryCommands;
    }
}
/**
 * Fail fast when tag-derived release windows are requested from a checkout
 * with incomplete git tag history.
 *
 * Two checkout states are rejected because they provably omit tag refs the
 * window derivation depends on:
 *   - a shallow clone (even when some tags survive, the ones truncated away
 *     silently collapse the window);
 *   - a full clone configured to exclude tags (`git clone --no-tags` records
 *     `remote.<name>.tagOpt=--no-tags`), regardless of how many tags are
 *     locally present — a tag-excluding checkout that picked up SOME tags
 *     (single-tag fetch, later push) has a partial set that collapses the
 *     previous-tag window just as silently as zero tags would.
 * Continuing in either state would misreport a correct CHANGELOG.md as stale.
 * A full clone with zero tags and NO tag-excluding config is NOT rejected —
 * that is the intentional first-release state, and the existing
 * pending-version / unbounded-window fallbacks for it are preserved unchanged.
 */
export function assertReleaseTagHistory(options) {
    const cwd = resolve(options.cwd ?? process.cwd());
    const requiredBy = options.requiredBy.filter(Boolean);
    const subject = requiredBy.length > 0 ? requiredBy.join(" ") : "Tag-derived release windows";
    const verb = requiredBy.length === 1 ? "requires" : "require";
    const noTagsRemote = tagExcludingRemote(cwd);
    if (isShallowRepository(cwd)) {
        // A shallow clone that ALSO excludes tags by config needs the config
        // unset too, or the recovered checkout would trip the --no-tags
        // diagnostic below on the next run.
        const recovery = noTagsRemote
            ? `git config --unset ${noTagsRemote}.tagOpt && git fetch --tags --unshallow`
            : "git fetch --tags --unshallow";
        throw new MissingTagHistoryError(`Missing git tag history [${MISSING_TAG_HISTORY_ERROR_CODE}]: ${subject} ${verb} complete git release tag refs, ` +
            `but ${cwd} is a shallow clone (git rev-parse --is-shallow-repository = true), so the tag history needed to derive the release window is unavailable. ` +
            `Restore it with \`${recovery}\` (or \`git fetch --tags\` when the clone is already full but lacks tag refs), then re-run the command.`, noTagsRemote
            ? [`git config --unset ${noTagsRemote}.tagOpt`, "git fetch --tags --unshallow"]
            : undefined);
    }
    if (noTagsRemote) {
        // Rejected regardless of how many tags are present locally: a checkout
        // that excludes tags by config may have picked up SOME tags (an explicit
        // single-tag fetch, a later push), and a partial tag set silently
        // collapses the previous-tag window just like zero tags would.
        throw new MissingTagHistoryError(`Missing git tag history [${MISSING_TAG_HISTORY_ERROR_CODE}]: ${subject} ${verb} complete git release tag refs, ` +
            `but ${cwd} was cloned with --no-tags (git config ${noTagsRemote}.tagOpt = --no-tags), so its tag refs are deliberately excluded and any tags present may be incomplete. ` +
            `Restore them with \`git config --unset ${noTagsRemote}.tagOpt && git fetch --tags\`, then re-run the command.`, [`git config --unset ${noTagsRemote}.tagOpt`, "git fetch --tags"]);
    }
}
// `git clone --no-tags` durably records remote.<name>.tagOpt=--no-tags. A
// checkout carrying that config is a tag-excluding clone whose tag set cannot
// be trusted to be complete — not a first-release repo. Returns the remote
// config prefix (e.g. "remote.origin") so the diagnostic can name the exact
// recovery command, or undefined when no remote excludes tags.
function tagExcludingRemote(cwd) {
    const config = runGit(cwd, ["config", "--get-regexp", String.raw `^remote\..*\.tagopt$`]);
    if (!config)
        return undefined;
    for (const line of config.split("\n")) {
        const [key, value] = line.trim().split(/\s+/, 2);
        if (value === "--no-tags" && key)
            return key.replace(/\.tagopt$/i, "");
    }
    return undefined;
}
function isShallowRepository(cwd) {
    // `--is-shallow-repository` resolves through worktree `.git` files, unlike a
    // literal `.git/shallow` path probe. When git itself is unavailable (not a
    // repository) the lookup fails open so existing non-git fallbacks are kept.
    return runGit(cwd, ["rev-parse", "--is-shallow-repository"]) === "true";
}
export function resolveReleaseContext(options) {
    const cwd = resolve(options.cwd ?? process.cwd());
    const tagDerivedFlags = [
        options.sincePreviousTag ? "--since-previous-tag" : undefined,
        options.untilReleaseTag ? "--until-release-tag" : undefined,
    ].filter((flag) => Boolean(flag));
    if (tagDerivedFlags.length > 0) {
        assertReleaseTagHistory({ cwd, requiredBy: tagDerivedFlags });
    }
    const version = options.version ?? (options.versionFromPackage ? readPackageVersion(cwd) : undefined);
    const releaseTag = version ? findExistingTag(cwd, releaseTagCandidates(version)) : undefined;
    const previousTag = options.sincePreviousTag ? findPreviousTag(cwd, releaseTag) : undefined;
    const releaseTimestamp = releaseTag ? tryGitCommitTimestamp(cwd, releaseTag) : undefined;
    return {
        version,
        date: releaseTimestamp ? formatLocalTimestampDate(releaseTimestamp) : undefined,
        releaseTag,
        previousTag,
        since: options.since ?? (previousTag ? tryGitCommitTimestamp(cwd, previousTag) : undefined),
        until: options.until ?? (options.untilReleaseTag ? releaseTimestamp : undefined),
    };
}
export function resolveReleaseTagWindows(options = {}) {
    const cwd = resolve(options.cwd ?? process.cwd());
    assertReleaseTagHistory({ cwd, requiredBy: ["--all-release-tags"] });
    const tags = listReleaseTags(cwd, options.tagPattern ?? "v*", options.includeOrphaned);
    const pending = resolvePendingReleaseTag(options, tags);
    const orderedTags = pending
        ? [...tags, pending].sort(compareReleaseTags)
        : tags;
    if (orderedTags.length === 0)
        return [];
    const windows = [];
    if (options.includeUnreleased !== false) {
        windows.push({
            heading: "Unreleased",
            since: orderedTags[0].timestamp,
            sinceExclusive: true,
        });
    }
    for (let index = 0; index < orderedTags.length; index++) {
        const tag = orderedTags[index];
        const previous = orderedTags[index + 1];
        windows.push({
            heading: `${formatTagVersion(tag.name)} - ${formatLocalTimestampDate(tag.timestamp)}`,
            releaseTag: tag.name,
            since: previous?.timestamp,
            sinceExclusive: Boolean(previous),
            until: tag.timestamp,
        });
    }
    return windows;
}
function resolvePendingReleaseTag(options, existingTags) {
    const version = options.pendingVersion?.trim();
    if (!version)
        return undefined;
    const candidates = releaseTagCandidates(version);
    const candidateSet = new Set(candidates);
    if (existingTags.some((tag) => candidateSet.has(tag.name)))
        return undefined;
    const canonical = canonicalPendingTagName(candidates, version);
    const timestamp = normalizeTimestamp(options.pendingTimestamp ?? new Date().toISOString());
    return { name: canonical, timestamp };
}
function canonicalPendingTagName(candidates, fallback) {
    // Preserve the caller's version format (the first candidate is the
    // verbatim `v${version}`). Do not force calendar months/days to a
    // zero-padded width: downstream consumers (e.g. the pm-cli release
    // pipeline) key off the unpadded `YYYY.M.D` heading they passed in, so
    // padding here would emit a `2026.05.27` heading the caller never matches.
    return candidates.find((candidate) => candidate.startsWith("v")) ?? fallback;
}
function readPackageVersion(cwd) {
    const packageJsonPath = findPackageJson(cwd);
    if (!packageJsonPath) {
        throw new Error("--release-version-from-package requires a package.json in the current directory or an ancestor");
    }
    const parsed = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    if (typeof parsed.version !== "string" || parsed.version.trim() === "") {
        throw new Error(`${packageJsonPath} does not contain a valid version field`);
    }
    return parsed.version;
}
function findPackageJson(start) {
    let current = start;
    while (true) {
        const candidate = join(current, "package.json");
        if (existsSync(candidate))
            return candidate;
        const parent = dirname(current);
        if (parent === current)
            return undefined;
        current = parent;
    }
}
function findExistingTag(cwd, candidates) {
    for (const candidate of candidates) {
        const result = runGit(cwd, ["rev-parse", "--verify", "--quiet", `refs/tags/${candidate}`]);
        if (result)
            return candidate;
    }
    return undefined;
}
function releaseTagCandidates(version) {
    // Normalize away a leading `v` so callers may pass either `2026.5.27` or
    // `v2026.5.27` without producing a malformed `vv...` candidate. The first
    // candidate is the canonical (caller-formatted) tag; padded variants are
    // appended only so we can still resolve legacy zero-padded tags.
    const trimmed = version.trim().replace(/^v/i, "");
    const candidates = [`v${trimmed}`, trimmed];
    const calendar = trimmed.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})(-.+)?$/);
    if (calendar) {
        const [, year, month, day, suffix = ""] = calendar;
        const padded = `${year}.${month.padStart(2, "0")}.${day.padStart(2, "0")}${suffix}`;
        candidates.push(`v${padded}`, padded);
    }
    return Array.from(new Set(candidates));
}
function findPreviousTag(cwd, releaseTag) {
    const ref = releaseTag ? `${releaseTag}^` : "HEAD";
    return runGit(cwd, ["describe", "--tags", "--abbrev=0", ref]);
}
function listReleaseTags(cwd, pattern, includeOrphaned = false) {
    const args = ["tag", "--list", pattern];
    // Default to reachable tags only. When includeOrphaned is set the `--merged
    // HEAD` filter is dropped so tags orphaned by rebases/history rewrites are
    // still discovered; the chronological sort and item-to-window assignment
    // below place every item in the correct release bucket regardless of
    // reachability.
    if (!includeOrphaned)
        args.push("--merged", "HEAD");
    args.push("--format=%(refname:short)%09%(*committerdate:iso-strict)%09%(committerdate:iso-strict)");
    const output = runGit(cwd, args);
    if (!output)
        return [];
    return output
        .split("\n")
        .map(parseTagLine)
        .filter((tag) => Boolean(tag))
        .sort(compareReleaseTags);
}
/**
 * Total deterministic comparator for ReleaseTag pairs. Contract:
 *  1. Valid parsed timestamps sort in descending order (newest first).
 *  2. A tag with a valid (parseable) timestamp sorts before one with an invalid
 *     unparseable timestamp, regardless of name.
 *  3. Two tags with equally-invalid timestamps tie-break by name ascending.
 *
 * This replaces bare `Date.parse(a) - Date.parse(b)` which returns `NaN` when
 * either timestamp is unparseable — and `Array.sort(NaN)` is non-deterministic
 * (the spec says the sort order is implementation-defined when the comparator
 * does not return a total order).
 */
function compareReleaseTags(a, b) {
    const aTime = Date.parse(a.timestamp);
    const bTime = Date.parse(b.timestamp);
    const aValid = !Number.isNaN(aTime);
    const bValid = !Number.isNaN(bTime);
    if (aValid && bValid) {
        // Both parse → newest first (descending)
        const diff = bTime - aTime;
        if (diff !== 0)
            return diff;
        // Same instant → name tie-break
        return compareTagNames(a.name, b.name);
    }
    if (aValid !== bValid) {
        // One valid, one invalid → valid before invalid
        return aValid ? -1 : 1;
    }
    // Neither parses → name tie-break (stable total order)
    return compareTagNames(a.name, b.name);
}
function compareTagNames(a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
}
function parseTagLine(line) {
    const [name, peeledCommitterDate, directCommitterDate] = line.split("\t");
    const tagName = name?.trim();
    const rawTimestamp = (peeledCommitterDate || directCommitterDate)?.trim();
    if (!tagName || !rawTimestamp)
        return undefined;
    // Canonicalize the offset of UTC-equivalent timestamps to ISO `Z` form so the
    // exported `since`/`until` window strings are stable across git versions:
    // older git emits `...T12:00:00Z` from `%(committerdate:iso-strict)` while
    // git >= ~2.42 emits `...T12:00:00+00:00`. Only UTC-equivalent offsets (`Z`,
    // `+00:00`, `-00:00`) are rewritten -- they denote the same instant and the
    // same UTC date, so the heading date (`formatLocalTimestampDate` reads the
    // date prefix of this string) is unaffected. Non-zero offsets are preserved
    // verbatim so a tag's heading keeps reflecting its original (committer-local)
    // date instead of being shifted to UTC. Downstream `filterItemsByTime` parses
    // via `Date.parse` (offset-agnostic), so selection is unaffected either way.
    const timestamp = canonicalizeUtcOffset(rawTimestamp);
    return { name: tagName, timestamp };
}
function tryGitCommitTimestamp(cwd, ref) {
    return runGit(cwd, ["log", "-1", "--format=%cI", ref]);
}
function runGit(cwd, args) {
    try {
        const output = execFileSync("git", args, {
            cwd,
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "ignore"],
        }).trim();
        return output || undefined;
    }
    catch {
        return undefined;
    }
}
function formatTagVersion(tag) {
    // Strip the leading `v` and normalize away zero-padding on calendar
    // (`YYYY.M.D[-N]`) versions so a padded git tag like `v2026.06.13` renders
    // the same unpadded `2026.6.13` heading that `canonicalPendingTagName`
    // emits pre-tag and that the pm-cli release pipeline keys off. Without this
    // the release heading flips from `2026.6.13` to `2026.06.13` the moment the
    // padded tag is pushed, so the committed CHANGELOG mismatches every later
    // regeneration and `changelog:check` fails fleet-wide (issue #41).
    // Non-calendar tags (semver `1.2.3`, etc.) are left untouched.
    const trimmed = tag.replace(/^v/i, "");
    const calendar = trimmed.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})(-.+)?$/);
    if (!calendar)
        return trimmed;
    const [, year, month, day, suffix = ""] = calendar;
    return `${year}.${Number(month)}.${Number(day)}${suffix}`;
}
function formatDate(timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime()))
        return timestamp.slice(0, 10);
    return date.toISOString().slice(0, 10);
}
function formatLocalTimestampDate(timestamp) {
    const match = timestamp.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s]|$)/);
    if (match)
        return match[1];
    return formatDate(timestamp);
}
function normalizeTimestamp(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()))
        return value;
    return date.toISOString();
}
// UTC-equivalent offset suffixes emitted by git's `%(committerdate:iso-strict)`
// (and by `iso8601`/RFC-3339 in general). All denote the same instant; only the
// textual form differs across git versions, which is the root cause of audit
// finding F2 (fragile test). Used by `canonicalizeUtcOffset`.
const UTC_OFFSET_SUFFIXES = ["Z", "+00:00", "+0000", "-00:00", "-0000"];
// Rewrite a UTC-equivalent timestamp to the canonical ISO `Z` form without
// altering its instant or UTC date. Non-UTC offsets (and unparseable strings)
// are returned verbatim so callers that depend on the local date prefix (e.g.
// `formatLocalTimestampDate`) are unaffected. This is intentionally narrower
// than `normalizeTimestamp` (which always converts to UTC via `toISOString`).
function canonicalizeUtcOffset(value) {
    const trimmed = value.trim();
    const offset = extractOffset(trimmed);
    if (offset === null)
        return value; // no offset / not ISO-strict → leave as-is
    if (!UTC_OFFSET_SUFFIXES.includes(offset))
        return value; // non-UTC → preserve local date
    const withoutOffset = trimmed.slice(0, trimmed.length - offset.length);
    const parsed = new Date(`${withoutOffset}Z`);
    if (Number.isNaN(parsed.getTime()))
        return value;
    return parsed.toISOString();
}
// Extract the trailing timezone offset of an ISO-8601 / RFC-3339 timestamp:
// `Z`, `±HH:MM`, or `±HHMM`. Returns `null` when no offset is present (the
// timestamp is "local" or naively formatted) so the caller can avoid guessing.
function extractOffset(value) {
    if (value.endsWith("Z"))
        return "Z";
    const match = value.match(/[+-]\d{2}:?\d{2}$/);
    return match ? match[0] : null;
}
//# sourceMappingURL=release-context.js.map