'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';

type Issue = { field: string; message: string };
export class ApiError extends Error {
  constructor(message: string, public fields: Issue[] = []) { super(message); this.name='ApiError'; }
}
function fieldMessage(field: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string {
  if (field instanceof HTMLInputElement && field.type === 'checkbox' && field.required && !field.checked) return 'Подтвердите согласие, чтобы продолжить.';
  if (field.required && !field.value.trim()) return 'Заполните это поле.';
  if (field.validity.tooShort) return `Введите не менее ${'minLength' in field ? field.minLength : 1} символов.`;
  if (field.validity.patternMismatch) return 'Используйте латиницу, цифры, точку, дефис или подчёркивание.';
  if (field.validity.rangeUnderflow || field.validity.rangeOverflow || field.validity.badInput) return 'Проверьте указанное значение.';
  if (!field.validity.valid) return 'Проверьте значение в этом поле.';
  return '';
}
export function useFormFeedback() {
  const ref = useRef<HTMLFormElement>(null);
  const [errors, setErrors] = useState<Record<string,string>>({});
  const update = (target: EventTarget) => {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) || !target.name) return;
    const message=fieldMessage(target);
    target.setAttribute('aria-invalid', String(!!message));
    if(message) target.setAttribute('aria-describedby',`error-${target.name}`); else target.removeAttribute('aria-describedby');
    setErrors(old=>({...old,[target.name]:message}));
  };
  const validate = (form: HTMLFormElement) => {
    let first: HTMLElement | null=null;
    for(const node of Array.from(form.elements)) if(node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement || node instanceof HTMLSelectElement){ update(node); if(fieldMessage(node)&&!first)first=node; }
    first?.focus();
    return !first;
  };
  const serverError = (error: unknown) => {
    if(error instanceof ApiError) {
      const next: Record<string,string>={};
      for(const issue of error.fields){const name=issue.field.replace(/^body\./,'');const field=ref.current?.elements.namedItem(name);if(field instanceof HTMLElement){next[name]=issue.message.replace(/^Value error, /,'');field.setAttribute('aria-invalid','true');field.setAttribute('aria-describedby',`error-${name}`);}}
      setErrors(old=>({...old,...next}));
    }
    return error instanceof Error?error.message:'Не удалось сохранить. Попробуйте ещё раз.';
  };
  return { ref, errors, validate, serverError, events: { noValidate:true, onBlurCapture:(e:FormEvent<HTMLFormElement>)=>update(e.target), onChangeCapture:(e:FormEvent<HTMLFormElement>)=>{ const target=e.target as HTMLInputElement;if(errors[target.name])update(target); } } };
}
export function FieldError({name,errors}:{name:string;errors:Record<string,string>}) {return errors[name]?<span id={`error-${name}`} className="inline-field-error" role="alert">{errors[name]}</span>:null;}

export function useUnsavedChanges(dirty: boolean) {
  useEffect(()=>{
    if(!dirty)return;
    const beforeUnload=(event:BeforeUnloadEvent)=>{event.preventDefault();};
    window.addEventListener('beforeunload',beforeUnload);
    return()=>window.removeEventListener('beforeunload',beforeUnload);
  },[dirty]);
}
