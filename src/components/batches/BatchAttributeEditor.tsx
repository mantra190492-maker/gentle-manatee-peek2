"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";
import type { BatchAttribute } from "@/types/batches/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BatchAttributeEditorProps {
  batchId: string;
  attributes: BatchAttribute[];
  onAttributesUpdated: () => void;
}

export function BatchAttributeEditor({ batchId, attributes, onAttributesUpdated }: BatchAttributeEditorProps) {
  const [localAttributes, setLocalAttributes] = useState<BatchAttribute[]>(attributes);
  const [newAttribute, setNewAttribute] = useState({ key: "", value: "" });
  const [isSaving, setIsSaving] = useState(false);

  const handleAttributeChange = (index: number, field: "key" | "value", value: string) => {
    const updatedAttributes = [...localAttributes];
    updatedAttributes[index] = { ...updatedAttributes[index], [field]: value };
    setLocalAttributes(updatedAttributes);
  };

  const handleAddAttribute = () => {
    if (newAttribute.key.trim() && newAttribute.value.trim()) {
      setLocalAttributes(prev => [...prev, { id: `new-${Date.now()}`, batch_id: batchId, created_at: new Date().toISOString(), ...newAttribute }]);
      setNewAttribute({ key: "", value: "" });
    } else {
      toast.error("Key and Value are required for new attribute.");
    }
  };

  const handleRemoveAttribute = (idToRemove: string) => {
    setLocalAttributes(prev => prev.filter(attr => attr.id !== idToRemove));
  };

  const handleSaveAttributes = async () => {
    setIsSaving(true);
    try {
      // Separate existing attributes from new ones
      const existingAttributes = localAttributes.filter(attr => !attr.id.startsWith('new-'));
      const newAttributes = localAttributes.filter(attr => attr.id.startsWith('new-'));

      // Delete removed attributes
      const attributesToDelete = attributes.filter(
        existing => !localAttributes.some(local => local.id === existing.id)
      );
      if (attributesToDelete.length > 0) {
        const { error } = await supabase.from('batch_attributes').delete().in('id', attributesToDelete.map(a => a.id));
        if (error) throw error;
      }

      // Update existing attributes
      for (const attr of existingAttributes) {
        const originalAttr = attributes.find(a => a.id === attr.id);
        if (originalAttr && (originalAttr.key !== attr.key || originalAttr.value !== attr.value)) {
          const { error } = await supabase.from('batch_attributes').update({ key: attr.key, value: attr.value }).eq('id', attr.id);
          if (error) throw error;
        }
      }

      // Insert new attributes
      if (newAttributes.length > 0) {
        const inserts = newAttributes.map(attr => ({ batch_id: batchId, key: attr.key, value: attr.value }));
        const { error } = await supabase.from('batch_attributes').insert(inserts);
        if (error) throw error;
      }

      toast.success("Batch attributes saved!");
      onAttributesUpdated(); // Refresh parent data
    } catch (err: any) {
      toast.error(err.message || "Failed to save attributes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 p-4 rounded-md bg-white shadow-sm">
      <h4 className="font-semibold text-gray-900 mb-3">Custom Attributes</h4>
      <div className="space-y-3">
        {localAttributes.map((attr, index) => (
          <div key={attr.id} className="flex items-center gap-2">
            <Input
              value={attr.key}
              onChange={e => handleAttributeChange(index, "key", e.target.value)}
              placeholder="Attribute Key"
              className="flex-1"
            />
            <Input
              value={attr.value}
              onChange={e => handleAttributeChange(index, "value", e.target.value)}
              placeholder="Attribute Value"
              className="flex-1"
            />
            <Button variant="ghost" size="icon" onClick={() => handleRemoveAttribute(attr.id)}>
              <Trash2 className="w-4 h-4 text-rose-500" />
            </Button>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <Input
            value={newAttribute.key}
            onChange={e => setNewAttribute({ ...newAttribute, key: e.target.value })}
            placeholder="New Key"
            className="flex-1"
          />
          <Input
            value={newAttribute.value}
            onChange={e => setNewAttribute({ ...newAttribute, value: e.target.value })}
            placeholder="New Value"
            className="flex-1"
          />
          <Button variant="outline" size="icon" onClick={handleAddAttribute}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="flex justify-end mt-4">
        <Button onClick={handleSaveAttributes} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Save Attributes
        </Button>
      </div>
    </div>
  );
}