import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Shield, TrendingUp, RefreshCw, Megaphone, MoreVertical, ChevronLeft, ChevronRight, Play, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/dropdown-menu';

interface KPICardProps {
  title: string;
  value: string;
  change: string;
  changePositive: boolean;
  icon: React.ReactNode;
  valueColor?: string;
}

function KPICard({ title, value, change, changePositive, icon, valueColor = 'text-foreground' }: KPICardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColor}`}>{value}</div>
        <p className={`text-xs mt-1 ${changePositive ? 'text-green-600' : 'text-secondary'}`}>
          {change}
        </p>
      </CardContent>
    </Card>
  );
}

interface Task {
  id: string;
  task: string;
  severity: 'High' | 'Medium' | 'Low';
  dueDate: string;
}

interface AgendaEvent {
  id: string;
  time: string;
  title: string;
  description: string;
}

interface TutorialVideo {
  id: string;
  title: string;
  description: string;
  duration: string;
  color: string;
}

export function Dashboard() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Placeholder data - will be replaced with API calls later
  const announcement = {
    message: "Important Announcement. The Restructure Period will begin in 15 minutes. All teams are to finalize their task re-alignments.",
    timeRemaining: "15 minutes"
  };

  const tutorialVideos: TutorialVideo[] = [
    {
      id: '1',
      title: 'Getting Started with Chat',
      description: 'Learn how to start a new chat, switch between agents, and use text messaging features.',
      duration: '2:30',
      color: 'bg-blue-500/10 text-blue-500'
    },
    {
      id: '2',
      title: 'Using Voice Communication',
      description: 'Master the voice interface, including mute, hold, and interruption settings.',
      duration: '3:45',
      color: 'bg-purple-500/10 text-purple-500'
    },
    {
      id: '3',
      title: 'Managing Settings',
      description: 'Configure your profile, notification preferences, and application theme.',
      duration: '1:15',
      color: 'bg-amber-500/10 text-amber-500'
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % tutorialVideos.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + tutorialVideos.length) % tutorialVideos.length);
  };

  return (
    <div className="h-full overflow-y-auto p-6 bg-background">
      {/* Dashboard Title */}
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Important Announcement Banner */}
      <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4 mb-8 flex items-start gap-3 shadow-sm">
        <Megaphone className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-secondary font-semibold uppercase tracking-wider mb-1">Latest Announcement</p>
          <p className="text-sm text-secondary font-medium">{announcement.message}</p>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Revenue"
          value="$128,430"
          change="+12.5% from last month"
          changePositive={true}
          icon={<DollarSign className="h-4 w-4" />}
          valueColor="text-green-600"
        />
        <KPICard
          title="Active Agents"
          value="45"
          change="+3 new today"
          changePositive={true}
          icon={<Shield className="h-4 w-4" />}
        />
        <KPICard
          title="Conversion Rate"
          value="24.8%"
          change="+4.2% since yesterday"
          changePositive={true}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPICard
          title="System Latency"
          value="124ms"
          change="-12ms improvement"
          changePositive={true}
          icon={<RefreshCw className="h-4 w-4" />}
        />
      </div>

      {/* Recent Activity Section (Placeholder) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Performance</CardTitle>
            <CardDescription>Overview of your organizational agent activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-40 flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/30">
              <p className="text-muted-foreground">Performance graph placeholder</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start gap-2" variant="outline">
              <TrendingUp className="h-4 w-4" /> Explore Insights
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <Shield className="h-4 w-4" /> Security Audit
            </Button>
            <Button className="w-full justify-start gap-2" variant="outline">
              <RefreshCw className="h-4 w-4" /> System Refresh
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
