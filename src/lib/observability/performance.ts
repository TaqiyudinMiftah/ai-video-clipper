type PerformanceMetadata = Record<string, string | number | boolean | null | undefined>;

export function logPerformanceEvent(event: string, metadata: PerformanceMetadata) {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event,
      component: "web-performance",
      metadata,
    }),
  );
}
