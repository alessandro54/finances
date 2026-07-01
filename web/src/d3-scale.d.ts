// layerchart bundles d3-scale but ships no types for it. We only use scaleThreshold
// as an opaque factory passed to <BarChart cScale>, so a loose ambient decl is enough.
declare module 'd3-scale';
