# Grading system

This note records the current grade behavior and the boundary between the grade domain and locale. The preset describes a scale; it does not identify a country or language.

## Implemented now

The `numeric-1-6` preset in `lib/grading.ts` describes the behavior used by the application:

- Grades are finite numbers in the inclusive range 1–6. Values may have any decimal precision; the input parser also accepts decimal commas and adjacent half notation such as `4-5`.
- Higher values are better. A value of 4 or above passes.
- Subject averages are weighted arithmetic means using assessment and grade-type weights. The overall average is a weighted arithmetic mean of subject averages using subject coefficients. Neither calculation rounds its stored or returned result.
- Grade values are displayed to one decimal place. Chart series use two decimal places. The simulator reports the required grade rounded up to the next half point, with a small floating-point tolerance; that reporting step is part of the current preset.
- Goal selection starts at 4 and ends at 6, as it does today.

Grades remain numeric `Grade.value` values in the existing `SchoolData` object. The diary is still validated with `diarySchema` and stored in the existing JSON payload; the same schema is used by diary API validation, local storage/import, and backups. There is no grading-system field in the database or diary payload. Existing values need no conversion.

## Prepared architecturally

`GradingSystem` separates numeric ranges from ordered labels, and describes value order, an optional passing value, formatting precision, and whether an average is supported. The current numeric preset is the only configured system. Pure helpers centralize its valid range, parsing, comparison, pass check, display precision, progress scale, and simulator rounding. Current weighted-mean formulas remain in `lib/calculations.ts`; their arithmetic is now shared with the public calculator and their results are unchanged.

The shape permits future numeric ranges with either direction and ordered labels that do not claim an arithmetic mean. It does not implement their input, display, comparison, statistics, or persistence behavior. Locale selection remains independent of a grading system.

## Not implemented

IB, GCSE, percentages, letter grades, A–F, custom scales, grading-system selection, per-subject schemes, conversion between systems, and database or diary migrations are not implemented. No universal conversion (for example, IB to GPA) is assumed.

## Inventory of current dependencies

| Area | Current dependency | Treatment |
| --- | --- | --- |
| Domain | Grade values are finite numbers; weighted arithmetic means and simulator formula operate on numbers. “Higher is better” is used to identify strongest and weakest subjects. | Range, order, passing rule, and simulator presentation step are described centrally. Mean formulas stay unchanged. |
| Persistence | `Grade.value` is numeric inside `SchoolData`; `SchoolData.version` is 1. SQLite stores diary data as a JSON payload and has no normalized grade table or scheme key. | Kept schema-compatible; no migration or field added. |
| API | `gradeSchema` enforces the range through `diarySchema`; the grade creation tool publishes the same min/max. Diary writes persist the whole validated diary. | API and tool limits now read from the current preset. Grade schema continues to reject out-of-range values. |
| UI | Grade entry parses user text; the goal slider is bounded by pass threshold and maximum. Grade list and subject overview style below-threshold values; progress width maps the configured range. | Existing controls and colors retained, with limits and pass checks supplied by the preset. |
| Presentation | Localized labels explicitly state the current 1–6 scale and 4.0 passing mark. Landing preview and scale-specific error/help copy mention 1–6; the simulator's “1.0 is enough” copy assumes the same minimum. README states the current scale. Grade and average values are localized and displayed to one decimal place. | Accurate current-scale copy remains; the README no longer implies that users can customize the scale. Locale formatting is still handled by the i18n layer. |
| Tests | Parsing, validation, weighted averages and simulator behavior were covered in general domain tests. | Added focused tests for bounds, pass threshold, ordering, means, display precision, and simulator rounding. |

Intentional scale-specific copy includes the localized grade-scale label, grade error/help text, simulator minimum-result message, README description, and current landing preview. It describes the implemented product accurately and is not a locale-to-country mapping. Other occurrences of `1`, `4`, or `6` found in the code concern unrelated concepts such as schema version, weights, dates, absence hours, and layout; they are not grade rules.

The current grade screen adds and deletes grades, but has no direct edit action for an individual grade. An existing grade can still be updated in the validated diary snapshot/API payload; adding a grade-edit UI is a separate product task.

## Public grade average calculator

The public calculator uses the existing `numeric-1-6` preset for parsing and bounds. Its formula is `sum(grade × user weight) / sum(user weights)`, with default weight 1. `weightedArithmeticMean()` in `lib/calculations.ts` is the shared arithmetic primitive used by the calculator and the existing subject/overall calculations. The calculator deliberately does not apply assessment-type weights, subject coefficients, semesters, or a pass/fail judgement. Invalid grades or non-positive/non-finite weights cannot enter the calculation; an empty list has no average. The displayed result uses the preset's one-decimal precision, while calculation retains the unrounded value.

The tool runs entirely in client state. It does not call an API or persist the entered grades. Its four canonical routes and metadata are listed in `lib/i18n/public-routes.ts` and `lib/i18n/public-page.ts`. Calculator visits do not register the app service worker. If an existing registration checks for an update during a calculator visit, the new worker defers installation until an app or landing page is open, preserving the old offline shell. The utility does not promise offline navigation.

## Future association model (proposed)

The current `Grade` carries both `subjectId` and `semesterId`, while subject grade types and coefficients currently live on `Subject`. An account- or diary-level setting would be too broad if a student uses different systems in different subjects. A semester-level setting would still be too broad for that case, while putting a copied setting on every grade would make consistency and later changes difficult.

For a later task, prefer an explicit course offering/enrolment context for a subject in a semester (for example, a `SubjectTerm` record) with a grading-system reference, and have each grade refer to that context. This scopes the scheme to the assessed course for that term and avoids treating language, country, and scheme as interchangeable. If multiple schemes can apply inside one course, the model will need a still more specific assessment context. This is a proposal only; the current data model is unchanged.

## Suggested next task

Before adding a selectable system, decide the course-offering and assessment-context model, how legacy grades map to the `numeric-1-6` preset, and how each supported scheme defines validation, display, comparisons, and statistical operations. Add a scheme only when its input and reporting rules are explicit. Define any conversion as a separately sourced, contextual rule; do not infer one from numeric resemblance.
