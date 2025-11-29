import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import io from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import UploadImage from '@/components/UploadImage';
import { Car, AlertTriangle, Activity, Clock } from 'lucide-react';
import api from '@/lib/api';

const Dashboard = () => {
    const [realtimeDetections, setRealtimeDetections] = useState([]);
    const [socketStatus, setSocketStatus] = useState('disconnected');

    // Fetch Stats
    const { data: stats, refetch: refetchStats } = useQuery({
        queryKey: ['stats'],
        queryFn: async () => {
            const res = await api.get('/stats');
            return res.data;
        },
        refetchInterval: 30000,
    });

    // Socket Connection
    useEffect(() => {
        const socket = io('http://localhost:5000');

        socket.on('connect', () => setSocketStatus('connected'));
        socket.on('disconnect', () => setSocketStatus('disconnected'));

        socket.on('new-detection', (detection) => {
            setRealtimeDetections((prev) => [detection, ...prev].slice(0, 10));
            refetchStats();
        });

        return () => socket.disconnect();
    }, [refetchStats]);

    const handleUploadSuccess = (result) => {
        // Refresh stats after successful upload
        refetchStats();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${socketStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-muted-foreground capitalize">{socketStatus}</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Detections</CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalDetections || 0}</div>
                        <p className="text-xs text-muted-foreground">Lifetime detections</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Blacklist Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{stats?.blacklistedCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Vehicles flagged</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today's Activity</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.todayCount || 0}</div>
                        <p className="text-xs text-muted-foreground">Detections since midnight</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Cameras</CardTitle>
                        <CameraIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">1</div>
                        <p className="text-xs text-muted-foreground">Operational units</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Upload Component */}
                <div className="col-span-3">
                    <UploadImage onUploadSuccess={handleUploadSuccess} />
                </div>

                {/* Recent Alerts */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Alerts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats?.recentAlerts?.length === 0 && (
                                <div className="text-center py-10 text-muted-foreground">
                                    No recent alerts.
                                </div>
                            )}
                            {stats?.recentAlerts?.map((alert) => (
                                <Alert key={alert.id} variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Blacklisted Vehicle Detected</AlertTitle>
                                    <AlertDescription>
                                        Plate <strong>{alert.plateNumber}</strong> detected at {new Date(alert.timestamp).toLocaleTimeString()}
                                    </AlertDescription>
                                </Alert>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Live Feed */}
            <Card>
                <CardHeader>
                    <CardTitle>Live Feed</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {realtimeDetections.length === 0 && (
                            <div className="text-center py-10 text-muted-foreground">
                                Waiting for live detections...
                            </div>
                        )}
                        {realtimeDetections.map((detection) => (
                            <div key={detection.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-20 bg-muted rounded overflow-hidden relative">
                                        <img
                                            src={`http://localhost:5000/uploads/${detection.imagePath}`}
                                            alt="Plate"
                                            className="object-cover w-full h-full"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{detection.plateNumber}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            {new Date(detection.timestamp).toLocaleTimeString()}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    {detection.blacklistFlag ? (
                                        <Badge variant="destructive">BLACKLISTED</Badge>
                                    ) : (
                                        <Badge variant="secondary">Clean</Badge>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

function CameraIcon(props) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
            <circle cx="12" cy="13" r="3" />
        </svg>
    )
}

export default Dashboard;
