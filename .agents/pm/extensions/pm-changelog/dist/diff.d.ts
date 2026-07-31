/**
 * Unified-diff rendering for `--check` drift reporting.
 *
 * `--check` is a mandatory CI gate across the fleet, and its failure output is
 * usually read by an agent that cannot rerun the generator interactively. A
 * bare "Changelog is out of date" line forces that reader to clone the repo
 * and diff generator output by hand; printing the actual drift — which entries
 * differ, in which section, in which direction — makes the common cause (a PR
 * branch behind `main`, so the CI merge ref sees a release commit the branch
 * lacks) obvious in seconds.
 *
 * The package ships zero runtime dependencies, so the diff is computed here
 * (a longest-common-subsequence pass over lines, with shared prefix/suffix
 * trimming) rather than pulled in from a new dependency.
 */
/** Rendering knobs for {@link createUnifiedDiff}. Every field is optional: the
 * defaults match what the `--check` failure path needs (3 lines of context,
 * 200-line cap) so the CLI call site stays declarative. */
export interface UnifiedDiffOptions {
    /** Label for the old side of the diff (the `---` header). Pass an
     * unambiguous name — e.g. `committed CHANGELOG.md` — so the reader never
     * has to guess which side is on disk and which side was regenerated. */
    oldLabel?: string;
    /** Label for the new side of the diff (the `+++` header), e.g. `generated`. */
    newLabel?: string;
    /** Lines of unchanged context kept around each change (and used to decide
     * whether two nearby changes merge into one hunk). Default 3, matching
     * `diff -u` and `git diff`. */
    contextLines?: number;
    /** Maximum number of hunk lines emitted (the `---`/`+++` headers always
     * print and do not count toward the cap). A first-run or fully regenerated
     * changelog can differ in thousands of lines and must not flood a CI log.
     * Default {@link DEFAULT_MAX_DIFF_LINES}. */
    maxLines?: number;
}
export interface UnifiedDiffResult {
    /** The rendered unified diff, ending in a newline. Empty when the inputs
     * are identical (mirrors `diff -u`, which prints nothing for equal files). */
    text: string;
    /** True when the hunk output exceeded the cap and `text` is a prefix of the
     * full diff. */
    truncated: boolean;
    /** Number of hunk lines omitted when {@link truncated} is true, so the
     * caller can state the size of what was hidden. */
    omittedLines: number;
}
/** Default cap on emitted hunk lines. Exported so the `--check` truncation
 * notice can name the cap instead of hard-coding a second copy of the number. */
export declare const DEFAULT_MAX_DIFF_LINES = 200;
/**
 * Render a unified diff between two texts, line-oriented, with labeled sides
 * and a hard cap on emitted hunk lines. Exists so `--check` can show WHAT
 * drifted, not just THAT it drifted, without adding a runtime dependency.
 */
export declare function createUnifiedDiff(oldText: string, newText: string, options?: UnifiedDiffOptions): UnifiedDiffResult;
//# sourceMappingURL=diff.d.ts.map