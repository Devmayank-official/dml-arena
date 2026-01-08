import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  Smartphone, 
  Share, 
  Check, 
  ArrowLeft,
  Wifi,
  Zap,
  Bell
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Check for iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  const features = [
    {
      icon: Zap,
      title: 'Quick Access',
      description: 'Launch CompareAI instantly from your home screen',
    },
    {
      icon: Wifi,
      title: 'Works Offline',
      description: 'View your history even without an internet connection',
    },
    {
      icon: Bell,
      title: 'Full Screen',
      description: 'Enjoy a distraction-free, app-like experience',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/chat">
          <Button variant="ghost" size="sm" className="gap-2 mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mb-4">
            <Smartphone className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Install CompareAI</h1>
          <p className="text-muted-foreground">
            Get the full app experience on your device
          </p>
        </div>

        {isInstalled ? (
          <Card className="mb-8">
            <CardContent className="pt-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Already Installed!</h2>
              <p className="text-muted-foreground">
                CompareAI is installed on your device. Look for it on your home screen.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Install the App</CardTitle>
            </CardHeader>
            <CardContent>
              {isIOS ? (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    To install on iOS, follow these steps:
                  </p>
                  <ol className="space-y-3">
                    <li className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold">
                        1
                      </span>
                      <span>Tap the <Share className="inline h-4 w-4" /> Share button</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold">
                        2
                      </span>
                      <span>Scroll down and tap "Add to Home Screen"</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-semibold">
                        3
                      </span>
                      <span>Tap "Add" to confirm</span>
                    </li>
                  </ol>
                </div>
              ) : deferredPrompt ? (
                <div className="text-center">
                  <Button 
                    size="lg" 
                    onClick={handleInstall}
                    className="gap-2 bg-gradient-to-r from-primary to-accent"
                  >
                    <Download className="h-5 w-5" />
                    Install Now
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <p>
                    Your browser supports app installation. Use the browser menu 
                    to install CompareAI on your device.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Why Install?</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="pt-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 mb-3">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
