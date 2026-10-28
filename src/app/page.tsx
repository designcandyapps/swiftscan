import { SwiftScanClient } from '@/components/swift-scan-client';
import { Logo } from '@/components/icons';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Logo className="h-6 w-6 mr-2 text-primary" />
            <span className="font-bold">SwiftScan</span>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <SwiftScanClient />
      </main>
      <footer className="py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built by an expert user experience designer with accessibility in
            mind.
          </p>
        </div>
      </footer>
    </div>
  );
}
