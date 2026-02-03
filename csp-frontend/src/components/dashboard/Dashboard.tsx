import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Shield, TrendingUp, RefreshCw, Megaphone, MoreVertical } from 'lucide-react';
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

export function Dashboard() {
  // Placeholder data - will be replaced with API calls later
  const announcement = {
    message: "Important Announcement. The Restructure Period will begin in 15 minutes. All teams are to finalize their task re-alignments.",
    timeRemaining: "15 minutes"
  };

  const kpis = [
    {
      title: "Revenue",
      value: "$405,832.00",
      change: "+15.2% from last cycle",
      changePositive: true,
      icon: <DollarSign className="h-4 w-4" />,
      valueColor: "text-green-600"
    },
    {
      title: "On-Time Delivery",
      value: "92.1%",
      change: "-1.8% from last cycle",
      changePositive: false,
      icon: <Shield className="h-4 w-4" />,
      valueColor: "text-foreground"
    },
    {
      title: "Brand Perception",
      value: "78/100",
      change: "+5.0 from last cycle",
      changePositive: true,
      icon: <TrendingUp className="h-4 w-4" />,
      valueColor: "text-foreground"
    },
    {
      title: "Runway",
      value: "281 days",
      change: "-30 days from last cycle",
      changePositive: false,
      icon: <RefreshCw className="h-4 w-4" />,
      valueColor: "text-secondary"
    }
  ];

  const tasks: Task[] = [
    {
      id: "1",
      task: "Review Q3 Marketing Budget Proposal",
      severity: "High",
      dueDate: "1/12/2026"
    },
    {
      id: "2",
      task: "Address payment failure for Vendor 'CloudServe'",
      severity: "High",
      dueDate: "1/10/2026"
    },
    {
      id: "3",
      task: "Finalize competitor analysis report",
      severity: "High",
      dueDate: "1/11/2026"
    },
    {
      id: "4",
      task: "Approve new hiring requisitions",
      severity: "High",
      dueDate: "1/13/2026"
    },
    {
      id: "5",
      task: "Review quarterly financial statements",
      severity: "High",
      dueDate: "1/14/2026"
    }
  ];

  const majorsToday = {
    completed: 1,
    total: 2
  };

  const agendaEvents: AgendaEvent[] = [
    {
      id: "1",
      time: "10:00",
      title: "Mandatory Boardroom",
      description: "Cycle 2 Debrief & Cycle 3 Planning"
    },
    {
      id: "2",
      time: "13:00",
      title: "Lunch & Learn: AI in Sales",
      description: "Guest speaker from 'Sales AI Inc.' discusses new techniques."
    }
  ];

  return (
    <div className="h-full overflow-y-auto p-6 bg-background">
      {/* Dashboard Title */}
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Important Announcement Banner */}
      <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4 mb-6 flex items-start gap-3">
        <Megaphone className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
        <p className="text-sm text-secondary flex-1">{announcement.message}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.title}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            changePositive={kpi.changePositive}
            icon={kpi.icon}
            valueColor={kpi.valueColor}
          />
        ))}
      </div>

      {/* Bottom Section - Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hot Queue - Left Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Hot Queue</CardTitle>
              <CardDescription>Your top 5 highest priority tasks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-4 p-3 border-l-4 ${task.severity === 'High' ? 'border-secondary' :
                        task.severity === 'Medium' ? 'border-yellow-500' :
                          'border-primary dark:border-black'
                      } ${index !== tasks.length - 1 ? 'border-b' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{task.task}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${task.severity === 'High' ? 'bg-secondary/20 text-secondary' :
                            task.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-primary/10 text-primary dark:bg-black/20 dark:text-black'
                          }`}
                      >
                        {task.severity}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{task.dueDate}</span>
                      <DropdownMenu
                        trigger={
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        }
                        align="right"
                      >
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Mark Complete</DropdownMenuItem>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stacked */}
        <div className="space-y-6">
          {/* Majors Today */}
          <Card>
            <CardHeader>
              <CardTitle>Majors Today</CardTitle>
              <CardDescription>
                You have experienced {majorsToday.completed} of {majorsToday.total} major events for the day.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{majorsToday.completed}/{majorsToday.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-secondary h-2.5 rounded-full transition-all"
                    style={{ width: `${(majorsToday.completed / majorsToday.total) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Agenda */}
          <Card>
            <CardHeader>
              <CardTitle>Next Agenda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agendaEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center text-sm font-semibold">
                      {event.time.split(':')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
