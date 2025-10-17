"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  FormProvider,
  useFormContext,
} from "react-hook-form"
import { cn } from "@/lib/utils"

export function Form({ className, ...props }) {
  return <FormProvider {...props} />
}

export function FormField({
  control,
  name,
  render,
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={render}
    />
  )
}

export function FormItem({ className, ...props }) {
  return <div className={cn("space-y-2", className)} {...props} />
}

export const FormLabel = function FormLabel({ className, ...props }) {
  return (
    <label
      className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}
      {...props}
    />
  )
}

export function FormControl({ ...props }) {
  return <Slot {...props} />
}

export function FormDescription({ className, ...props }) {
  return (
    <p className={cn("text-[0.8rem] text-neutral-500", className)} {...props} />
  )
}

export function FormMessage({ className, children, ...props }) {
  const { formState } = useFormContext()
  const body = children || (formState.errors?.[props.name]?.message ?? null)
  return (
    <p className={cn("text-sm font-medium text-red-500", className)}>
      {body}
    </p>
  )
}

