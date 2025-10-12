'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { createMagicItemAction, updateMagicItemAction, type MagicItemFormState } from '@/lib/actions/magicItems';
import { ImageManager } from '@/components/ui/image-manager';
import { ImageInfo, parseImagesJson } from '@/lib/utils/imageUtils.client';
import { Save, Trash2 } from 'lucide-react';

const RARITY_OPTIONS = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'];

interface MagicItemFormProps {
    mode: 'create' | 'edit';
    magicItem?: {
        id: number;
        name: string;
        rarity: string | null;
        type: string | null;
        description: string | null;
        properties: string;
        attunementRequired: boolean | null;
        images: unknown;
    };
}

export function MagicItemForm({ mode, magicItem }: MagicItemFormProps) {
    const router = useRouter();
    const action = mode === 'create' ? createMagicItemAction : updateMagicItemAction;
    const [state, formAction] = useActionState<MagicItemFormState, FormData>(action, {} as MagicItemFormState);
    const [images, setImages] = useState<ImageInfo[]>(() => {
        if (mode === 'edit' && magicItem?.images) {
            return parseImagesJson(magicItem.images);
        }
        return [];
    });

    const handleImagesChange = (newImages: ImageInfo[]) => {
        setImages(newImages);
    };

    return (
        <Card className="max-w-3xl">
            <CardHeader>
                <CardTitle>{mode === 'create' ? 'Create magic item' : `Edit ${magicItem?.name ?? 'magic item'}`}</CardTitle>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-6">
                    <input type="hidden" name="images" value={JSON.stringify(images)} />
                    {mode === 'edit' && magicItem && (
                        <input type="hidden" name="id" value={magicItem.id} />
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="magic-item-name">Name</Label>
                        <Input
                            id="magic-item-name"
                            name="name"
                            defaultValue={magicItem?.name ?? ''}
                            placeholder="e.g. Sunsword"
                            required
                        />
                        {state?.errors?.name && (
                            <span className="text-sm text-error">{state.errors.name[0]}</span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="magic-item-type">Type</Label>
                            <Input
                                id="magic-item-type"
                                name="type"
                                defaultValue={magicItem?.type ?? ''}
                                placeholder="e.g. Weapon, Wondrous Item"
                            />
                            {state?.errors?.type && (
                                <span className="text-sm text-error">{state.errors.type[0]}</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="magic-item-rarity">Rarity</Label>
                            <Input
                                id="magic-item-rarity"
                                name="rarity"
                                list="magic-item-rarity-options"
                                defaultValue={magicItem?.rarity ?? ''}
                                placeholder="Select or enter rarity"
                            />
                            <datalist id="magic-item-rarity-options">
                                {RARITY_OPTIONS.map((rarity) => (
                                    <option key={rarity} value={rarity} />
                                ))}
                            </datalist>
                            {state?.errors?.rarity && (
                                <span className="text-sm text-error">{state.errors.rarity[0]}</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="magic-item-description">Description</Label>
                        <Textarea
                            id="magic-item-description"
                            name="description"
                            defaultValue={magicItem?.description ?? ''}
                            placeholder="Describe the item's appearance, abilities, and lore."
                            rows={6}
                        />
                        {state?.errors?.description && (
                            <span className="text-sm text-error">{state.errors.description[0]}</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="magic-item-properties">Properties (JSON)</Label>
                        <Textarea
                            id="magic-item-properties"
                            name="properties"
                            defaultValue={magicItem?.properties ?? ''}
                            placeholder='{"charges": 3, "damage": "1d8 radiant"}'
                            rows={6}
                        />
                        <p className="text-xs text-base-content/60">Provide structured data to power future automations. Leave blank if not needed.</p>
                        {state?.errors?.properties && (
                            <span className="text-sm text-error">{state.errors.properties[0]}</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="magic-item-attunement"
                            name="attunementRequired"
                            defaultChecked={magicItem?.attunementRequired ?? false}
                        />
                        <Label htmlFor="magic-item-attunement" className="text-sm">
                            Requires attunement
                        </Label>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Images</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ImageManager
                                entityType="magic-items"
                                entityId={magicItem?.id || 0}
                                currentImages={images}
                                onImagesChange={handleImagesChange}
                            />
                        </CardContent>
                    </Card>

                    {state?.message && (
                        <div className="rounded-md border border-error/40 bg-error/10 p-3 text-sm text-error">
                            {state.message}
                        </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-3">
                        <Button
                            type="submit"
                            variant="primary"
                            className="gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {mode === 'create' ? 'Create' : 'Update'}
                        </Button>
                        <Button
                            type="button"
                            variant="neutral"
                            className="gap-2"
                            onClick={() => router.back()}
                        >
                            <Trash2 className="h-4 w-4" />
                            Cancel
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
