import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Calendar } from 'lucide-react';
import api from '@/lib/api';

const History = () => {
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({
        plate: '',
        blacklisted: '',
    });

    const { data, isLoading } = useQuery({
        queryKey: ['detections', page, filters],
        queryFn: async () => {
            const params = {
                page,
                limit: 20,
                plate: filters.plate || undefined,
                blacklisted: filters.blacklisted === 'true' ? true : undefined,
            };
            const res = await api.get('/detections', { params });
            return res.data;
        },
        keepPreviousData: true,
    });

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1); // Reset to page 1 on search
        // Filters state is already updated via onChange
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Detection History</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search Plate Number..."
                                value={filters.plate}
                                onChange={(e) => setFilters(prev => ({ ...prev, plate: e.target.value }))}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                value={filters.blacklisted}
                                onChange={(e) => setFilters(prev => ({ ...prev, blacklisted: e.target.value }))}
                            >
                                <option value="">All Status</option>
                                <option value="true">Blacklisted Only</option>
                                <option value="false">Clean Only</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Image</TableHead>
                                <TableHead>Plate Number</TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Camera</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">Loading...</TableCell>
                                </TableRow>
                            ) : data?.data?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10">No records found</TableCell>
                                </TableRow>
                            ) : (
                                data?.data?.map((detection) => (
                                    <TableRow key={detection.id}>
                                        <TableCell>
                                            <div className="h-10 w-16 bg-muted rounded overflow-hidden">
                                                <img
                                                    src={`http://localhost:5000/uploads/${detection.imagePath}`}
                                                    alt="Plate"
                                                    className="object-cover w-full h-full"
                                                    onError={(e) => e.target.style.display = 'none'}
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">{detection.plateNumber}</TableCell>
                                        <TableCell>{new Date(detection.timestamp).toLocaleString()}</TableCell>
                                        <TableCell>Camera {detection.cameraId}</TableCell>
                                        <TableCell>
                                            {detection.blacklistFlag ? (
                                                <Badge variant="destructive">Blacklisted</Badge>
                                            ) : (
                                                <Badge variant="secondary">Clean</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Simple Pagination */}
            <div className="flex justify-center gap-2">
                <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                    Previous
                </Button>
                <Button
                    variant="outline"
                    disabled={!data || page >= data.pagination.totalPages}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
};

export default History;
