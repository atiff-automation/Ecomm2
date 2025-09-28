'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { AlertCircle, Info } from 'lucide-react';

interface SettingsInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const SettingsInput: React.FC<SettingsInputProps> = ({
  label,
  error,
  helperText,
  required,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Input
        {...props}
        className={`${className} ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${props.id}-error` : 
          helperText ? `${props.id}-help` : undefined
        }
      />
      
      {error && (
        <div id={`${props.id}-error`} className="flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {helperText && !error && (
        <div id={`${props.id}-help`} className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>{helperText}</span>
        </div>
      )}
    </div>
  );
};

interface SettingsSelectProps {
  label: React.ReactNode;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export const SettingsSelect: React.FC<SettingsSelectProps> = ({
  label,
  options,
  placeholder,
  required,
  error,
  helperText,
  value,
  onValueChange,
  disabled
}) => {
  const selectId = React.useId();

  return (
    <div className="space-y-2">
      <Label htmlFor={selectId} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger 
          id={selectId}
          className={error ? 'border-red-500 focus:ring-red-500' : ''}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${selectId}-error` : 
            helperText ? `${selectId}-help` : undefined
          }
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {error && (
        <div id={`${selectId}-error`} className="flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {helperText && !error && (
        <div id={`${selectId}-help`} className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>{helperText}</span>
        </div>
      )}
    </div>
  );
};

interface SettingsTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: React.ReactNode;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const SettingsTextarea: React.FC<SettingsTextareaProps> = ({
  label,
  error,
  helperText,
  required,
  className = '',
  ...props
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={props.id} className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      <Textarea
        {...props}
        className={`${className} ${error ? 'border-red-500 focus:ring-red-500' : ''}`}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${props.id}-error` : 
          helperText ? `${props.id}-help` : undefined
        }
      />
      
      {error && (
        <div id={`${props.id}-error`} className="flex items-center space-x2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
      
      {helperText && !error && (
        <div id={`${props.id}-help`} className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>{helperText}</span>
        </div>
      )}
    </div>
  );
};

interface SettingsSwitchProps {
  label: React.ReactNode;
  description?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
}

export const SettingsSwitch: React.FC<SettingsSwitchProps> = ({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
  required
}) => {
  const switchId = React.useId();

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="space-y-0.5 flex-1">
        <Label htmlFor={switchId} className="text-sm font-medium cursor-pointer">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <Switch
        id={switchId}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
};

interface SettingsFormActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const SettingsFormActions: React.FC<SettingsFormActionsProps> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`flex items-center justify-end space-x-4 pt-6 border-t ${className}`}>
      {children}
    </div>
  );
};