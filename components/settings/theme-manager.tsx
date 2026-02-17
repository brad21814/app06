'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { getThemesCollection } from '@/lib/firestore/client/collections';
import { getDocs, query, where, addDoc, updateDoc, deleteDoc, doc, Timestamp, onSnapshot } from 'firebase/firestore';
import { Theme } from '@/types/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Plus, Trash, Edit2, Loader2, Eye, BadgeInfo } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

interface ThemeFormProps {
    formData: {
        name: string;
        description: string;
        questions: string[];
    };
    setFormData: React.Dispatch<React.SetStateAction<{
        name: string;
        description: string;
        questions: string[];
    }>>;
    readOnly?: boolean;
}

function ThemeForm({ formData, setFormData, readOnly = false }: ThemeFormProps) {
    const handleAddQuestion = () => {
        if (readOnly) return;
        setFormData(prev => ({ ...prev, questions: [...prev.questions, ''] }));
    };

    const handleQuestionChange = (index: number, value: string) => {
        if (readOnly) return;
        const newQuestions = [...formData.questions];
        newQuestions[index] = value;
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };

    const handleRemoveQuestion = (index: number) => {
        if (readOnly) return;
        const newQuestions = formData.questions.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, questions: newQuestions }));
    };

    return (
        <div className="space-y-4 py-4">
            <div className="space-y-2">
                <Label>Theme Name</Label>
                <Input
                    placeholder="e.g. Trust & Safety"
                    value={formData.name}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
                    disabled={readOnly}
                />
            </div>
            <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                    placeholder="Briefly describe this theme..."
                    value={formData.description}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
                    disabled={readOnly}
                />
            </div>
            <div className="space-y-2">
                <Label>Questions</Label>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {formData.questions.map((q, idx) => (
                        <div key={idx} className="flex gap-2">
                            <Input
                                placeholder={`Question ${idx + 1}`}
                                value={q}
                                onChange={(e) => handleQuestionChange(idx, e.target.value)}
                                disabled={readOnly}
                            />
                            {!readOnly && formData.questions.length > 1 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleRemoveQuestion(idx)}
                                    className="shrink-0"
                                >
                                    <Trash className="w-4 h-4 text-red-500" />
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
                {!readOnly && (
                    <Button type="button" variant="outline" size="sm" onClick={handleAddQuestion} className="w-full mt-2">
                        <Plus className="w-4 h-4 mr-2" /> Add Question
                    </Button>
                )}
            </div>
        </div>
    );
}

export function ThemeManager() {
    const { user, userData } = useAuth();
    const [userThemes, setUserThemes] = useState<Theme[]>([]);
    const [systemThemes, setSystemThemes] = useState<Theme[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Dialog States
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        questions: ['']
    });

    useEffect(() => {
        if (!userData?.accountId) {
            setLoading(false);
            return;
        }

        // Fetch User Themes
        const userThemesQuery = query(getThemesCollection(), where('accountId', '==', userData.accountId));
        const unsubUserThemes = onSnapshot(userThemesQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Theme));
            setUserThemes(data);
        }, (error) => {
            console.error("Error fetching user themes:", error);
        });

        // Fetch System Themes
        const systemThemesQuery = query(getThemesCollection(), where('accountId', '==', null));
        const unsubSystemThemes = onSnapshot(systemThemesQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Theme));
            setSystemThemes(data);
            setLoading(false); // Assume loaded when either returns or at least started
        }, (error) => {
            console.error("Error fetching system themes:", error);
            setLoading(false);
        });

        return () => {
            unsubUserThemes();
            unsubSystemThemes();
        };
    }, [userData?.accountId]);

    const resetForm = () => {
        setFormData({ name: '', description: '', questions: [''] });
        setSelectedTheme(null);
    };

    const loadFormData = (theme: Theme) => {
        setFormData({
            name: theme.name,
            description: theme.description,
            questions: theme.questions.length ? theme.questions : ['']
        });
    }

    const openEditDialog = (theme: Theme) => {
        setSelectedTheme(theme);
        loadFormData(theme);
        setIsEditOpen(true);
    };

    const openViewDialog = (theme: Theme) => {
        setSelectedTheme(theme);
        loadFormData(theme);
        setIsViewOpen(true);
    };

    const openDeleteDialog = (theme: Theme) => {
        setSelectedTheme(theme);
        setIsDeleteOpen(true);
    };

    const handleCreateTheme = async () => {
        if (!formData.name || !userData?.accountId) return;
        setActionLoading(true);

        try {
            const newTheme: Omit<Theme, 'id'> = {
                accountId: userData.accountId,
                name: formData.name,
                description: formData.description,
                questions: formData.questions.filter(q => q.trim() !== ''),
                createdBy: user!.uid,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            const docRef = await addDoc(getThemesCollection(), newTheme as any);
            // Local state update handled by snapshot
            setIsCreateOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error creating theme:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateTheme = async () => {
        if (!selectedTheme || !formData.name) return;
        setActionLoading(true);

        try {
            const themeRef = doc(getThemesCollection(), selectedTheme.id);
            const updates = {
                name: formData.name,
                description: formData.description,
                questions: formData.questions.filter(q => q.trim() !== ''),
                updatedAt: Timestamp.now(),
            };

            await updateDoc(themeRef, updates);
            // Local state update handled by snapshot
            setIsEditOpen(false);
            resetForm();
        } catch (error) {
            console.error("Error updating theme:", error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteTheme = async () => {
        if (!selectedTheme) return;
        setActionLoading(true);

        try {
            await deleteDoc(doc(getThemesCollection(), selectedTheme.id));
            // Local state update handled by snapshot
            setIsDeleteOpen(false);
            setSelectedTheme(null);
        } catch (error) {
            console.error("Error deleting theme:", error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div>Loading themes...</div>;

    return (
        <div className="space-y-8">

            {/* System Themes Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-medium flex items-center gap-2">
                            System Themes
                            <Badge variant="secondary" className="text-xs">Standard</Badge>
                        </h3>
                        <p className="text-sm text-gray-500">Standard themes available to all organizations.</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    {systemThemes.length === 0 && (
                        <div className="text-center py-4 text-gray-500 border rounded-lg bg-gray-50 text-sm">
                            No system themes available.
                        </div>
                    )}
                    {systemThemes.map(theme => (
                        <Card key={theme.id} className="p-4 flex flex-col md:flex-row justify-between md:items-start gap-4 bg-gray-50/50 border-dashed">
                            <div className="flex-1 space-y-2">
                                <div>
                                    <h4 className="font-semibold">{theme.name}</h4>
                                    <p className="text-sm text-gray-500">{theme.description}</p>
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium text-xs text-gray-500 uppercase tracking-wider">{theme.questions.length} Questions</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button variant="outline" size="sm" onClick={() => openViewDialog(theme)}>
                                    <Eye className="w-4 h-4 mr-2" /> View Questions
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="border-t pt-2"></div>

            {/* User Themes Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-medium">Your Themes</h3>
                        <p className="text-sm text-gray-500">Custom themes created for your organization.</p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        New Theme
                    </Button>
                </div>

                <div className="grid gap-4">
                    {userThemes.length === 0 && (
                        <div className="text-center py-8 text-gray-500 border rounded-lg bg-gray-50">
                            No custom themes found. Create one to customize your connections.
                        </div>
                    )}
                    {userThemes.map(theme => (
                        <Card key={theme.id} className="p-4 flex flex-col md:flex-row justify-between md:items-start gap-4">
                            <div className="flex-1 space-y-2">
                                <div>
                                    <h4 className="font-semibold">{theme.name}</h4>
                                    <p className="text-sm text-gray-500">{theme.description}</p>
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium text-xs text-gray-500 uppercase tracking-wider">{theme.questions.length} Questions</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button variant="ghost" size="sm" onClick={() => openEditDialog(theme)}>
                                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => openDeleteDialog(theme)}>
                                    <Trash className="w-4 h-4 mr-2" /> Delete
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>


            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Theme</DialogTitle>
                        <DialogDescription>Define a new set of questions for your team connections.</DialogDescription>
                    </DialogHeader>
                    <ThemeForm formData={formData} setFormData={setFormData} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateTheme} disabled={!formData.name || actionLoading}>
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Theme
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Theme</DialogTitle>
                    </DialogHeader>
                    <ThemeForm formData={formData} setFormData={setFormData} />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateTheme} disabled={!formData.name || actionLoading}>
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog (Read Only) */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {selectedTheme?.name}
                            <Badge variant="secondary">System Theme</Badge>
                        </DialogTitle>
                        <DialogDescription>
                            This is a standard theme and cannot be edited.
                        </DialogDescription>
                    </DialogHeader>
                    <ThemeForm formData={formData} setFormData={setFormData} readOnly={true} />
                    <DialogFooter>
                        <Button onClick={() => setIsViewOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Theme?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedTheme?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDeleteTheme} disabled={actionLoading}>
                            {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete Theme
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
