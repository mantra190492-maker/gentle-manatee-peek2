"use client";
import React from "react";
import type { Shipment } from "@/types/batches/types";
import { format } from "date-fns";
import { Truck, MapPin, CalendarDays, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface BatchShipmentItemProps {
  shipment: Shipment;
}

export function BatchShipmentItem({ shipment }: BatchShipmentItemProps) {
  return (
    <div className="flex items-start gap-3 p-3 border border-gray-200 rounded-md bg-white shadow-sm">
      <Truck className="w-5 h-5 text-blue-600 shrink-0" />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-900">{shipment.to_party}</span>
          <span className="text-xs text-gray-500">{format(new Date(shipment.shipped_on), "MMM d, yyyy")}</span>
        </div>
        {shipment.to_address && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <MapPin className="w-3 h-3" />
            <span>{shipment.to_address}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-sm text-gray-700 mt-1">
          <span>{shipment.qty} {shipment.uom}</span>
          {shipment.reference && (
            <span className="ml-auto flex items-center gap-1 text-xs text-gray-600">
              <Hash className="w-3 h-3" /> {shipment.reference}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}