'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings2, Check, Loader2 } from 'lucide-react';
import { BACKGROUND_OPTIONS, BackgroundOption } from '@/lib/video/processor-manager';
import { cn } from '@/lib/utils';

interface BackgroundSettingsProps {
    activeId: string;
    onSelect: (optionId: string) => void;
    isChanging?: boolean;
    disabled?: boolean;
}

export function BackgroundSettings({ activeId, onSelect, isChanging, disabled }: BackgroundSettingsProps) {
    const categories = Array.from(new Set(BACKGROUND_OPTIONS.map(o => o.category)));

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button 
                    variant="outline" 
                    size="icon" 
                    disabled={disabled}
                    className={cn(activeId !== 'none' && "border-orange-500 text-orange-500")}
                >
                    <Settings2 className="w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b bg-gray-50/50">
                    <h4 className="font-semibold text-sm">Video Background</h4>
                    <p className="text-xs text-muted-foreground">Select an effect or image for your call</p>
                </div>
                
                <Tabs defaultValue={categories[0]} className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-10 px-4 gap-4">
                        {categories.map(cat => (
                            <TabsTrigger 
                                key={cat} 
                                value={cat}
                                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-orange-500 rounded-none px-0 text-xs"
                            >
                                {cat}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    
                    <div className="p-4 max-h-[300px] overflow-y-auto">
                        {categories.map(cat => (
                            <TabsContent key={cat} value={cat} className="mt-0 outline-none">
                                <div className="grid grid-cols-2 gap-2">
                                    {BACKGROUND_OPTIONS.filter(o => o.category === cat).map(option => (
                                        <button
                                            key={option.id}
                                            onClick={() => onSelect(option.id)}
                                            disabled={isChanging}
                                            className={cn(
                                                "group relative flex flex-col items-center justify-center rounded-lg border-2 p-1 transition-all hover:border-orange-200 aspect-video overflow-hidden",
                                                activeId === option.id ? "border-orange-500 bg-orange-50/50" : "border-transparent bg-gray-50"
                                            )}
                                        >
                                            {option.type === 'none' ? (
                                                <div className="flex flex-col items-center justify-center h-full w-full">
                                                    <span className="text-[10px] font-medium">None</span>
                                                </div>
                                            ) : option.type === 'blur' ? (
                                                <div className="flex flex-col items-center justify-center h-full w-full bg-gray-200/50 backdrop-blur-md">
                                                    <span className="text-[10px] font-medium text-gray-600">Blur</span>
                                                </div>
                                            ) : (
                                                <div className="relative h-full w-full">
                                                    <img 
                                                        src={option.url} 
                                                        alt={option.name}
                                                        className="h-full w-full object-cover rounded-md"
                                                    />
                                                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                                    <span className="absolute bottom-1 left-1 text-[8px] font-bold text-white uppercase tracking-wider">
                                                        {option.name}
                                                    </span>
                                                </div>
                                            )}

                                            {activeId === option.id && (
                                                <div className="absolute top-1 right-1 bg-orange-500 rounded-full p-0.5 shadow-sm">
                                                    <Check className="w-2.5 h-2.5 text-white" />
                                                </div>
                                            )}
                                            
                                            {isChanging && activeId === option.id && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px]">
                                                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </TabsContent>
                        ))}
                    </div>
                </Tabs>
            </PopoverContent>
        </Popover>
    );
}
