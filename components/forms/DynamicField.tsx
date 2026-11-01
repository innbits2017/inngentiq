type Props = {
  field: any;
  values: Record<string, any>;
  setValues: React.Dispatch<
    React.SetStateAction<Record<string, any>>
  >;
};

export default function DynamicField({
  field,
  values,
  setValues,
}: Props) {
  switch (field.field_type) {
    case "text":
    case "email":
    case "number":
    case "date":
      return (
        <input
          type={field.field_type}
          value={values[field.field_key] ?? ""}
          onChange={(e) =>
            setValues((prev) => ({
              ...prev,
              [field.field_key]: e.target.value,
            }))
          }
          placeholder={field.placeholder}
          className="w-full rounded-lg border px-3 py-2"
        />
      );

    case "phone":
      return (
        <input
          type="tel"
          value={values[field.field_key] ?? ""}
          onChange={(e) =>
            setValues((prev) => ({
              ...prev,
              [field.field_key]: e.target.value,
            }))
          }
          placeholder={field.placeholder}
          className="w-full rounded-lg border px-3 py-2"
        />
      );

    case "textarea":
      return (
        <textarea
          value={values[field.field_key] ?? ""}
          onChange={(e) =>
            setValues((prev) => ({
              ...prev,
              [field.field_key]: e.target.value,
            }))
          }
          placeholder={field.placeholder}
          rows={4}
          className="w-full rounded-lg border px-3 py-2"
        />
      );

    case "select":
      return (
        <select
          value={values[field.field_key] ?? ""}
          onChange={(e) =>
            setValues((prev) => ({
              ...prev,
              [field.field_key]: e.target.value,
            }))
          }
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="">Select</option>

          {field.options?.map((option: string) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );

    case "radio":
      return (
        <div className="space-y-2">
          {field.options?.map((option: string) => (
            <label
              key={option}
              className="flex items-center gap-2"
            >
              <input
                type="radio"
                name={field.field_key}
                value={option}
                checked={values[field.field_key] === option}
                onChange={(e) =>
                  setValues((prev) => ({
                    ...prev,
                    [field.field_key]: e.target.value,
                  }))
                }
              />
              {option}
            </label>
          ))}
        </div>
      );

    case "checkbox":
      return (
        <div className="space-y-2">
          {field.options?.map((option: string) => {
            const selected =
              values[field.field_key] ?? [];

            return (
              <label
                key={option}
                className="flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setValues((prev) => ({
                        ...prev,
                        [field.field_key]: [
                          ...(prev[field.field_key] ?? []),
                          option,
                        ],
                      }));
                    } else {
                      setValues((prev) => ({
                        ...prev,
                        [field.field_key]: (
                          prev[field.field_key] ?? []
                        ).filter(
                          (item: string) => item !== option
                        ),
                      }));
                    }
                  }}
                />
                {option}
              </label>
            );
          })}
        </div>
      );

    default:
      return null;
  }
}