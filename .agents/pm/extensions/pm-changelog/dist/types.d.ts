export type PmItemStatus = "open" | "in_progress" | "blocked" | "closed" | "canceled" | "draft" | string;
export interface PmItem {
    id?: string;
    title: string;
    body?: string;
    /** Long-form prose. In pm workspaces the item body is stored in
     * `description`; `body` is frequently empty. The opt-in `--body-preview`
     * feature falls back to this when `body` is empty. Never affects default
     * output. */
    description?: string;
    status?: PmItemStatus;
    priority?: number;
    type?: string;
    tags?: string[];
    release?: string;
    milestone?: string;
    /** Optional explicit breaking-change flag. Consulted only by the opt-in
     * `--breaking-changes` / `--suggest-semver` features; never affects default
     * output. */
    breaking?: unknown;
    metadata?: Record<string, unknown>;
    url?: string;
    /** Person an item is assigned to. Surfaced in the optional Contributors
     * section (`--contributors`); never affects default output. */
    assignee?: string;
    /** Person who authored an item. Used as a Contributors fallback when no
     * assignee is set. Never affects default output. */
    author?: string;
    created_at?: string;
    updated_at?: string;
    closed_at?: string;
    /** Actual work completion time. Preferred over tracker close time for release windows. */
    completed_at?: string;
    due_date?: string;
}
/** OPT-IN (`--summary`): a compact one-line-per-change entry for quick agent
 * scanning. Each entry pairs a release heading with the category/group and the
 * item title/id, so agents can ingest changes without parsing full markdown. */
export interface ChangelogSummaryEntry {
    /** Release heading (e.g. "1.2.0 - 2026-05-17" or "Unreleased - 2026-05-17"). */
    heading: string;
    /** Normalized version key (e.g. "1.2.0"), or undefined for Unreleased. */
    version?: string;
    /** Category or field-group heading the item falls under (Added/Fixed/Feature/...). */
    category: string;
    id?: string;
    title: string;
    type?: string;
    status?: string;
}
export type ChangelogGroupBy = "version" | "release" | "milestone";
/** Within-release grouping selector for the opt-in `--section-by` flag.
 * `"category"` is the default and reproduces the historical
 * keep-a-changelog grouping (Added/Changed/Fixed/...) byte-for-byte. */
export type ChangelogSectionBy = "category" | "type" | "status" | "label";
/** How pm item IDs are rendered as references in generated changelog entries,
 * controlled by the opt-in `--item-ref-style` flag.
 * - `"auto"` (default): an internal `.toon` blob link when `itemUrlBase` is set,
 *   otherwise a neutral `(id)` label. Reproduces the historical behavior exactly.
 * - `"label"`: always a neutral `(id)` label — never a link. Safe for changelogs
 *   published to a public registry, where internal `.agents/pm/...` blob URLs leak
 *   tracker structure and may 404.
 * - `"toon"`: force the internal `.toon` blob link (requires `itemUrlBase`; falls
 *   back to a label when `itemUrlBase` is unset).
 * - `"github"`: render a public GitHub issue/PR link derived from the item's
 *   `gh:owner/repo#number` provenance tag (as written by pm-github); items lacking
 *   a valid provenance tag fall back to a neutral label. */
export type ChangelogItemRefStyle = "auto" | "label" | "toon" | "github";
export interface ChangelogReleaseWindow {
    heading: string;
    /** Git tag name (e.g. "v1.2.0") for this window. When set, items whose
     * `release` field matches this tag are bucketed here regardless of their
     * timestamps, eliminating duplicates from `pm update --release` bumping
     * `updated_at` after the tag was created. */
    releaseTag?: string;
    since?: string;
    sinceExclusive?: boolean;
    until?: string;
}
export interface GenerateChangelogOptions {
    items: PmItem[];
    title?: string;
    version?: string;
    date?: string;
    since?: string;
    until?: string;
    includeStatuses?: string[];
    groupBy?: ChangelogGroupBy;
    releaseWindows?: ChangelogReleaseWindow[];
    includeEmpty?: boolean;
    includeLinks?: boolean;
    /** Base URL used to construct clickable links for pm item IDs.
     * When set, each item ID in the changelog becomes a hyperlink:
     * `[pmc-abc]({itemUrlBase}/pmc-abc.toon)` */
    itemUrlBase?: string;
    /** OPT-IN: how pm item IDs are rendered as references. Absent → `"auto"`, which
     * reproduces the historical behavior (blob link when `itemUrlBase` is set, else a
     * neutral label). See {@link ChangelogItemRefStyle}. */
    itemRefStyle?: ChangelogItemRefStyle;
    /** OPT-IN: within-release grouping. Absent or `"category"` reproduces the
     * historical keep-a-changelog grouping byte-for-byte. */
    sectionBy?: ChangelogSectionBy;
    /** OPT-IN: when true, map category-style headings to Conventional-Commits
     * headings (Features/Bug Fixes/Documentation/...). Only takes effect with
     * the default `sectionBy: "category"` grouping. Absent → headings unchanged. */
    conventional?: boolean;
    /** OPT-IN: append a "Contributors" list per release, derived from item
     * assignee (falling back to author). Absent → no Contributors section. */
    contributors?: boolean;
    /** OPT-IN: keep only the most recent N release sections. Applies only when
     * `releaseWindows` produced the sections. Absent/0 → all releases. */
    limit?: number;
    /** OPT-IN: keep only release sections at or newer than this version.
     * Applies only when `releaseWindows` produced the sections (the `Unreleased`
     * section is always kept). Absent → all releases. */
    sinceVersion?: string;
    /** OPT-IN: when true, emit an extra `### Breaking Changes` group per release
     * listing items detected as breaking (type/tag/title contains "breaking", or
     * a truthy `breaking` flag). Absent → no Breaking Changes section. */
    breakingChanges?: boolean;
    /** OPT-IN: append the first N characters of each item's body/description to
     * its changelog entry (single-lined, escaped). Absent/0 → bodies omitted. */
    bodyPreview?: number;
    /** OPT-IN: prefix category headings with a conventional emoji
     * (Added 🎉, Fixed 🐛, ...). Absent → headings unprefixed. */
    emojiPrefix?: boolean;
    /** OPT-IN: append compact item metadata (`type`, `status`, `priority`,
     * `release`, `milestone`) to each bullet. Absent → metadata omitted. */
    includeMetadata?: boolean;
    /** OPT-IN: include a suggested semver bump in the `--changelog-json`
     * document. Never alters default markdown. Absent → no suggestion emitted. */
    suggestSemver?: boolean;
    /** OPT-IN: honor an item's `release` field (or `metadata.release`) when a
     * single version window is generated, matching what `releaseWindows`
     * (`--all-release-tags`) already does. An item that declares a release is
     * pinned to that release: it is kept when the release matches `version` (no
     * matter what its timestamps say) and dropped otherwise. Absent → the release
     * field is ignored outside `releaseWindows`, reproducing historical behavior.
     *
     * This is what lets a tracker closed long after its fix shipped stay out of
     * the current release: `pm update <id> --release <shipped-version>` records
     * where the work actually landed, and generation stops trusting `closed_at`. */
    respectItemRelease?: boolean;
    /** OPT-IN: drop items carrying any of these tags from every generation path,
     * giving repos an ignore convention (e.g. `changelog:ignore`) for pm items
     * that are legitimately tracked but are not user-facing package changes.
     * Matching is case-insensitive and trims surrounding whitespace.
     * Absent/empty → no items are excluded by tag. */
    excludeTags?: string[];
}
/** A truthy `breaking` flag may live directly on a pm item or in its metadata.
 * Used only by the opt-in `--breaking-changes` / `--suggest-semver` features. */
export interface PmItemBreakingFlag {
    breaking?: unknown;
}
export type SemverBump = "major" | "minor" | "patch" | "none";
/** Result of the opt-in `--suggest-semver` analysis. Emitted as JSON / footer
 * note only; never alters default markdown. */
export interface SemverSuggestion {
    bump: SemverBump;
    reason: string;
    counts: {
        breaking: number;
        feature: number;
        fix: number;
        other: number;
    };
}
export interface GeneratedChangelog {
    markdown: string;
    sections: ChangelogSection[];
    itemCount: number;
}
export type ChangelogOutputMode = "replace" | "prepend";
export type ChangelogMergeAction = "created" | "inserted" | "replaced" | "unchanged";
export interface MergeChangelogOptions {
    title?: string;
}
export interface MergeChangelogResult {
    markdown: string;
    action: ChangelogMergeAction;
    changed: boolean;
}
export interface ReadPmItemsOptions {
    pmRoot?: string;
    pmBin?: string;
    pmArgs?: string[];
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    maxBuffer?: number;
    /**
     * Pass `--include-body` to `pm list-all --json` so each row carries its body.
     * Required for `--body-preview` to render real body content (GH #27); the
     * field is otherwise omitted from list output.
     */
    includeBody?: boolean;
}
export interface WriteChangelogOptions extends GenerateChangelogOptions {
    output?: string;
    mode?: ChangelogOutputMode;
    check?: boolean;
}
export interface WriteChangelogResult {
    output: string;
    markdown: string;
    action: ChangelogMergeAction;
    changed: boolean;
    itemCount: number;
    bytes: number;
}
export interface ChangelogSection {
    heading: string;
    items: PmItem[];
}
/** A single item as it appears in the structured `--changelog-json` document. */
export interface ChangelogDocumentItem {
    id?: string;
    title: string;
    type?: string;
    status?: string;
    priority?: number;
    tags?: string[];
    release?: string;
    milestone?: string;
    url?: string;
}
/** A heading group (category/type/status/label) within a release. */
export interface ChangelogDocumentSection {
    heading: string;
    items: ChangelogDocumentItem[];
}
/** One release in the structured changelog document. */
export interface ChangelogDocumentRelease {
    heading: string;
    /** Normalized version key (e.g. "1.2.0"), or undefined for Unreleased. */
    version?: string;
    item_count: number;
    sections: ChangelogDocumentSection[];
    /** Present only when `--contributors` is set. */
    contributors?: string[];
    /** Present only when `--breaking-changes` is set: items detected as breaking. */
    breaking_changes?: ChangelogDocumentItem[];
}
/** Structured changelog produced by the opt-in `--changelog-json` flag. */
export interface ChangelogDocument {
    title: string;
    group_by: ChangelogGroupBy;
    section_by: ChangelogSectionBy;
    item_count: number;
    releases: ChangelogDocumentRelease[];
    /** Present only when `--suggest-semver` is set: recommended version bump. */
    suggested_semver?: SemverSuggestion;
}
/** Opt-in diagnostics describing how items flowed through changelog selection. */
export interface ChangelogSelectionReport {
    filters: {
        statuses: string[];
        since?: string;
        until?: string;
        release_windows: boolean;
        include_empty: boolean;
        limit?: number;
        since_version?: string;
        /** Present only when `--exclude-tag` was used: the normalized tag list. */
        exclude_tags?: string[];
        /** Present only when `--respect-item-release` was used. */
        respect_item_release?: boolean;
    };
    stage_counts: {
        input: number;
        after_title: number;
        after_excluded_tags: number;
        after_status: number;
        after_time: number;
        /** Present only when release attribution ran (`--respect-item-release`
         * outside `releaseWindows`). */
        after_item_release?: number;
        after_release_windows?: number;
        candidate_sections: number;
        visible_sections: number;
        candidate_items: number;
        visible_items: number;
    };
    excluded_counts: {
        missing_title: number;
        excluded_tag: number;
        status: number;
        time_window: number;
        item_release: number;
        release_window: number;
        hidden_by_visibility: number;
    };
    sample_items: {
        missing_title: string[];
        excluded_tag: string[];
        status: string[];
        time_window: string[];
        item_release: string[];
        release_window: string[];
        hidden_by_visibility: string[];
    };
    /** How the visible items' release-window placement was timestamped. Lets a
     * maintainer distinguish items attributed from the authoritative
     * `completed_at` from those attributed from an inferred fallback
     * (`closed_at`/`updated_at`/`created_at`) - the latter are the candidates for
     * a shipped-but-late-closed item that landed in the wrong release. Absent
     * when no items survived to a visible section. */
    attribution_provenance?: ChangelogAttributionProvenance;
    hints: string[];
}
/** Per-release-window completion-timestamp provenance for the visible items.
 * Counts items whose placement used the authoritative `completed_at` versus an
 * inferred fallback, and names the inferred ones so a maintainer can spot a
 * tracker that was closed long after its fix shipped. Items placed by an
 * explicit `release` declaration are reported separately, because no timestamp
 * decided where they landed. */
export interface ChangelogAttributionProvenance {
    /** Items whose release placement used the authoritative `completed_at`
     * (`fallback: false`). */
    authoritative: number;
    /** Items whose release placement used an inferred fallback timestamp
     * (`closed_at`, `updated_at`, or `created_at`; `fallback: true`). */
    inferred: number;
    /** Items placed by their own declared `release` field under
     * `--respect-item-release`, where the declaration - not any timestamp - chose
     * the release. Counted apart from `authoritative`/`inferred` so a late-close
     * hunt is not seeded with items whose placement was never in question. */
    release_pinned: number;
    /** The metadata field that supplied each inferred item's timestamp, keyed by
     * field name (`closed_at` / `updated_at` / `created_at`) to its count. */
    inferred_sources: Record<string, number>;
    /** Bounded, newest-first sample ids of items attributed from an inferred
     * timestamp - the candidates for a shipped-but-late-closed item that dated
     * into the wrong release. Ordered by resolved timestamp, most recent first,
     * so the freshest late-close candidate leads. Empty when no visible item was
     * attributed from an inferred timestamp. */
    inferred_sample: string[];
}
//# sourceMappingURL=types.d.ts.map