/* eslint-disable no-nested-ternary */
/* eslint-disable @repo/no-style-props */
import { type ComponentProps, useEffect, useState } from "react";
import { cn } from "@/src/utils/tailwind";
import { SLOW_QUERY_HINT_TEXT } from "@langfuse/shared";
import { Spinner } from "@/src/components/design-system/Spinner/Spinner";

const DEFAULT_HINT_DELAY_MS = 2000;
const PROGRESS_REVEAL_DELAY_MS = 1000;

function formatRows(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function QueryProgressBar({
  progress,
  className,
  layout = "default",
}: {
  progress?: {
    percent: number;
    read_rows: number;
    total_rows_to_read: number;
    elapsed_ns?: number;
    read_bytes?: number;
  } | null;
  className?: string;
  layout?: "default" | "compact" | "tight";
}) {
  const hasProgress = progress != null;
  const percent = hasProgress
    ? Math.max(0, Math.min(progress.percent * 100, 100))
    : 0;
  const compactLayout = layout !== "default";
  const showProgressLabel = layout !== "tight";

  return (
    <div className={cn("w-full min-w-0", className)}>
      <div
        role="progressbar"
        aria-label="Query progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={hasProgress ? Math.round(percent) : undefined}
        className={cn(
          "bg-muted/80 overflow-hidden rounded-full",
          compactLayout ? "h-1.5" : "h-2",
        )}
      >
        {hasProgress ? (
          <div
            className="bg-primary/60 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        ) : null}
      </div>
      {showProgressLabel ? (
        <p
          className={cn(
            "text-muted-foreground mt-2 tabular-nums",
            compactLayout ? "text-[11px] leading-4" : "text-xs",
          )}
        >
          {hasProgress
            ? `Reading ${formatRows(progress.read_rows)} / ~${formatRows(
                progress.total_rows_to_read,
              )} rows`
            : "Reading query progress..."}
        </p>
      ) : null}
    </div>
  );
}

type ChartLoadingStateProps = {
  className?: string;
  hintClassName?: string;
  spinnerLabel?: string;
  hintText?: string;
  hintDelayMs?: number;
  showSpinner?: boolean;
  showHintImmediately?: boolean;
  progress?: ComponentProps<typeof QueryProgressBar>["progress"];
  layout?: "default" | "compact" | "tight";
  onRetry?: () => void;
  retryLabel?: string;
};

export function ChartLoadingState({ ...props }: ChartLoadingStateProps) {
  return (
    <ChartLoadingStateContent
      key={`${props.showSpinner !== false}-${props.progress !== undefined}`}
      {...props}
    />
  );
}

function ChartLoadingStateContent({
  className,
  hintClassName,
  spinnerLabel = "Loading chart data",
  hintText = SLOW_QUERY_HINT_TEXT,
  hintDelayMs = DEFAULT_HINT_DELAY_MS,
  showSpinner = true,
  showHintImmediately = false,
  progress,
  layout = "default",
  onRetry,
  retryLabel = "Retry",
}: ChartLoadingStateProps) {
  const [showHint, setShowHint] = useState(false);
  const [showProgressPhase, setShowProgressPhase] = useState(false);
  const shouldShowProgress = progress !== undefined;
  const isPendingProgressState = showSpinner && shouldShowProgress;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setShowHint(true);
    }, hintDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hintDelayMs]);

  useEffect(() => {
    if (!isPendingProgressState) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowProgressPhase(true);
    }, PROGRESS_REVEAL_DELAY_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isPendingProgressState]);

  const shouldShowHint = showHintImmediately || showHint;
  const isCompact = layout !== "default";
  const isTight = layout === "tight";
  const isLegacySpinnerOnlyState = showSpinner && !shouldShowProgress;
  const isTightProgressState = isTight && shouldShowProgress;
  const shouldRenderStatusTitle = !isTightProgressState;
  const shouldRenderHint = shouldShowHint && !isTightProgressState;
  const shouldRenderRetry = Boolean(onRetry) && shouldShowHint && !showSpinner;

  if (
    isLegacySpinnerOnlyState ||
    (isPendingProgressState && !showProgressPhase)
  ) {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label={spinnerLabel}
        className={cn(
          "text-muted-foreground flex h-full w-full items-center justify-center",
          className,
        )}
      >
        <div className="flex h-4 w-4 items-center justify-center">
          <Spinner size="sm" />
        </div>
      </div>
    );
  }

  const statusTitle = (() => {
    if (isPendingProgressState || shouldShowProgress) {
      return "Running query";
    }
    if (showSpinner) {
      return "Loading widget";
    }
    return "Query needs attention";
  })();

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={spinnerLabel}
      className={cn(
        "text-muted-foreground flex h-full min-h-0 w-full flex-col overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "m-auto w-full",
          isTightProgressState
            ? "max-w-[12rem] px-3 py-2"
            : "max-w-sm px-4 py-4",
        )}
      >
        <div
          className={cn(
            "flex flex-col",
            isTightProgressState ? "gap-2" : isCompact ? "gap-3" : "gap-4",
          )}
        >
          {shouldRenderStatusTitle ? (
            <p
              className={cn(
                "text-foreground font-bold",
                shouldShowProgress ? "text-left" : "text-center",
                isTight ? "text-xs" : "text-sm",
              )}
            >
              {statusTitle}
            </p>
          ) : null}
          {shouldShowProgress ? (
            <QueryProgressBar progress={progress} layout={layout} />
          ) : showSpinner ? (
            <div className="flex h-4 w-4 items-center justify-center self-center">
              <Spinner size="sm" />
            </div>
          ) : null}

          {isTightProgressState ? null : (
            <p
              className={cn(
                "text-muted-foreground",
                shouldShowProgress ? "text-left" : "text-center",
                shouldRenderHint ? "animate-in fade-in-0 duration-300" : "",
                isTight
                  ? "line-clamp-3 min-h-12 text-[11px] leading-4"
                  : isCompact
                    ? "line-clamp-4 min-h-8 text-xs leading-4"
                    : "line-clamp-3 min-h-10 text-xs leading-5",
                hintClassName,
              )}
            >
              {shouldRenderHint ? (
                hintText
              ) : (
                <span aria-hidden="true">&nbsp;</span>
              )}
            </p>
          )}
          {shouldRenderRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="border-input bg-background hover:bg-accent w-fit self-center rounded-md border px-3 py-2 text-sm font-bold"
            >
              {retryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
