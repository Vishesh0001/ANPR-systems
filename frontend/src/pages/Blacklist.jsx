import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import api from '@/lib/api';

const Blacklist = () => {
    const queryClient = useQueryClient();
    const [newPlate, setNewPlate] = useState('');
    const [notes, setNotes] = useState('');

    // Fetch Blacklist
    const { data: blacklist, isLoading } = useQuery({
        queryKey: ['blacklist'],
        queryFn: async () => {
            const res = await api.get('/blacklist');
            return res.data;
        },
    });

    // Add Mutation
    const addMutation = useMutation({
        mutationFn: async (data) => {
            return api.post('/blacklist', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['blacklist']);
            setNewPlate('');
            setNotes('');
        },
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id) => {
            return api.delete(`/blacklist/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['blacklist']);
        },
    });

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newPlate) return;
        addMutation.mutate({ plateNumber: newPlate, notes });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Blacklist Management</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Add Form */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader>
                        <CardTitle>Add to Blacklist</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Plate Number</label>
                                <Input
                                    placeholder="e.g. ABC1234"
                                    value={newPlate}
                                    onChange={(e) => setNewPlate(e.target.value.toUpperCase())}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Notes (Optional)</label>
                                <Input
                                    placeholder="Reason for blacklisting"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={addMutation.isPending}>
                                {addMutation.isPending ? 'Adding...' : 'Add Vehicle'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* List */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Blacklisted Vehicles</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Plate Number</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead>Added At</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10">Loading...</TableCell>
                                    </TableRow>
                                ) : blacklist?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10">No blacklisted vehicles</TableCell>
                                    </TableRow>
                                ) : (
                                    blacklist?.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-bold">{item.plateNumber}</TableCell>
                                            <TableCell>{item.notes || '-'}</TableCell>
                                            <TableCell>{new Date(item.addedAt).toLocaleDateString()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive/90"
                                                    onClick={() => deleteMutation.mutate(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Blacklist;
