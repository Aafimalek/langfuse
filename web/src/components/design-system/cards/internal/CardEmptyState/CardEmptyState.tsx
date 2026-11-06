export function CardEmptyState({
  message = "No data",
  description,
  documentationUrl,
}: {
  message?: string;
  description?: string;
  documentationUrl?: string;
}) {
  return (
    <div className="text-muted-foreground flex min-h-36 flex-1 flex-col items-center justify-center gap-2 rounded-md border border-dashed p-4 text-center">
      <p>{message}</p>
      {description && <p className="text-sm">{description}</p>}
      {documentationUrl && (
        <a
          className="text-primary text-sm underline"
          href={documentationUrl}
          target="_blank"
          rel="noreferrer"
        >
          Learn more
        </a>
      )}
    </div>
  );
}
