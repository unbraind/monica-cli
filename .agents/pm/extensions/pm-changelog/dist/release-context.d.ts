import type { ChangelogReleaseWindow } from "./types.js";
export interface ReleaseContextOptions {
    cwd?: string;
    version?: string;
    versionFromPackage?: boolean;
    since?: string;
    sincePreviousTag?: boolean;
    until?: string;
    untilReleaseTag?: boolean;
}
export interface ReleaseTagHistoryOptions {
    cwd?: string;
    tagPattern?: string;
    /**
     * Include release tags that are not reachable from HEAD. Rebases and history
     * rewrites orphan release tags; excluding them collapses their items into the
     * oldest reachable window, silently losing legacy changelog sections. The pm
     * changelog CLI/extension set this to `true` so a full release history is
     * preserved. Defaults to `false` so the exported helper keeps the safe,
     * reachable-only `git tag --merged HEAD` semantics for external callers.
     */
    includeOrphaned?: boolean;
    includeUnreleased?: boolean;
    pendingVersion?: string;
    pendingTimestamp?: string;
}
export declare const MISSING_TAG_HISTORY_ERROR_CODE = "E_MISSING_TAG_HISTORY";
/**
 * Structured diagnostic raised when tag-derived release windows are requested
 * from a checkout whose git tag history is incomplete. Carries a stable
 * machine-readable `code` plus the recovery commands so agents and CI logs can
 * distinguish "missing git context" from "stale generated content".
 */
export declare class MissingTagHistoryError extends Error {
    readonly code = "E_MISSING_TAG_HISTORY";
    /**
     * Machine-readable list of recovery commands. Each entry is a single
     * independently-executable shell command; consumers run them in the listed
     * order. Entries are deliberately NOT compound `&&` expressions so callers
     * that execute each element discretely (CI bots, agents) still get a valid
     * command. The human-readable `message` may embed the inline `&&` form for
     * copy-paste convenience.
     */
    readonly recoveryCommands: readonly string[];
    constructor(message: string, recoveryCommands?: readonly string[]);
}
export interface AssertReleaseTagHistoryOptions {
    cwd?: string;
    /**
     * Names of the tag-derived flags/features the caller requested (e.g.
     * `--since-previous-tag`); used only to make the diagnostic name the exact
     * options that cannot be honored.
     */
    requiredBy: string[];
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
export declare function assertReleaseTagHistory(options: AssertReleaseTagHistoryOptions): void;
export interface ReleaseContext {
    version?: string;
    date?: string;
    since?: string;
    until?: string;
    releaseTag?: string;
    previousTag?: string;
}
export declare function resolveReleaseContext(options: ReleaseContextOptions): ReleaseContext;
export declare function resolveReleaseTagWindows(options?: ReleaseTagHistoryOptions): ChangelogReleaseWindow[];
//# sourceMappingURL=release-context.d.ts.map