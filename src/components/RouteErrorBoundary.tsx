import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface State { hasError: boolean; }

/**
 * Catches render-time errors from lazy routes (including chunk-load errors
 * that escaped the retry wrapper) and shows a friendly, styled fallback
 * instead of a blank/unstyled page.
 */
export class RouteErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("[RouteErrorBoundary]", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div dir="rtl" className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-bold">حدث خطأ أثناء تحميل الصفحة</h1>
          <p className="text-muted-foreground">
            قد يكون السبب تحديثًا جديدًا للموقع. حاول إعادة التحميل.
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()}>إعادة التحميل</Button>
            <Button variant="outline" onClick={() => (window.location.href = "/")}>
              العودة للصفحة الرئيسية
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
