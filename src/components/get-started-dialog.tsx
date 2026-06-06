"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PLAN_ITEMS: Record<string, string> = {
  starter: "Starter — Free",
  growth: "Growth — $29/mo",
  scale: "Scale — $99/mo",
};

type GetStartedDialogProps = {
  trigger: React.ReactElement;
  defaultPlan?: keyof typeof PLAN_ITEMS;
};

export function GetStartedDialog({
  trigger,
  defaultPlan = "growth",
}: GetStartedDialogProps) {
  const [plan, setPlan] = React.useState<string>(defaultPlan);

  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create your DMFlow account</DialogTitle>
          <DialogDescription>
            Connect your Instagram and start automating in under 5 minutes. No credit
            card required.
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-4"
          onSubmit={(e) => e.preventDefault()}
          id="get-started-form"
        >
          <div className="grid gap-1.5">
            <label htmlFor="gs-email" className="text-sm font-medium">
              Work email
            </label>
            <input
              id="gs-email"
              type="email"
              required
              placeholder="you@brand.com"
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="gs-plan" className="text-sm font-medium">
              Plan
            </label>
            <Select
              items={PLAN_ITEMS}
              value={plan}
              onValueChange={(value) => setPlan(value ?? defaultPlan)}
            >
              <SelectTrigger id="gs-plan" className="w-full">
                <SelectValue placeholder="Choose a plan" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PLAN_ITEMS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>

        <DialogFooter showCloseButton>
          <Button type="submit" form="get-started-form">
            Start free
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
