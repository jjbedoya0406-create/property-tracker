import { useState, type FormEvent } from "react";
import { propertyInputSchema, type PropertyInput } from "./schema";

interface PropertyFormProps {
  initialValues?: PropertyInput;
  submitLabel: string;
  isSubmitting?: boolean;
  onSubmit: (input: PropertyInput) => void;
  onCancel?: () => void;
}

export function PropertyForm({
  initialValues,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: PropertyFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [address, setAddress] = useState(initialValues?.address ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = propertyInputSchema.safeParse({ name, address });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setError(null);
    onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="property-name">Name</label>
        <input
          id="property-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div>
        <label htmlFor="property-address">Address</label>
        <input
          id="property-address"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
      </div>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={isSubmitting}>
        {submitLabel}
      </button>
      {onCancel && (
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      )}
    </form>
  );
}
