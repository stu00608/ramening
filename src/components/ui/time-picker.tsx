"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock } from "lucide-react";
import { useState } from "react";

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
}

export function TimePicker({
  value,
  onChange,
  placeholder = "選擇時間",
}: TimePickerProps) {
  const [open, setOpen] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  const [selectedHour, selectedMinute] = value ? value.split(":") : ["", ""];

  const handleTimeSelect = (hour: string, minute: string) => {
    const time = `${hour}:${minute}`;
    onChange(time);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="justify-start text-left font-normal w-full"
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="p-3">
            <p className="text-sm font-medium mb-2 text-center">小時</p>
            <ScrollArea className="h-48 w-16">
              <div className="space-y-1">
                {hours.map((hour) => (
                  <Button
                    key={hour}
                    variant={selectedHour === hour ? "default" : "ghost"}
                    className="w-full h-8 justify-center text-sm"
                    onClick={() => {
                      if (selectedMinute) {
                        handleTimeSelect(hour, selectedMinute);
                      } else {
                        onChange(`${hour}:00`);
                      }
                    }}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
          <div className="p-3 border-l">
            <p className="text-sm font-medium mb-2 text-center">分鐘</p>
            <ScrollArea className="h-48 w-16">
              <div className="space-y-1">
                {minutes
                  .filter((_, i) => i % 5 === 0)
                  .map((minute) => (
                    <Button
                      key={minute}
                      variant={selectedMinute === minute ? "default" : "ghost"}
                      className="w-full h-8 justify-center text-sm"
                      onClick={() => {
                        if (selectedHour) {
                          handleTimeSelect(selectedHour, minute);
                        } else {
                          onChange(`00:${minute}`);
                        }
                      }}
                    >
                      {minute}
                    </Button>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
