type Field = { name: string; value: string | readonly string[] };

/** A readable editorial treatment; this is displayed text, not executable code. */
export function CodeNote({
  name,
  fields,
}: {
  name: string;
  fields: readonly Field[];
}) {
  return (
    <div className="code-note">
      <span className="code-file" aria-hidden="true">
        {name}.ts
      </span>
      <code>
        <span className="code-line">
          <span className="code-keyword">const</span> {name} = {"{"}
        </span>
        {fields.map((field) => (
          <span className="code-line code-field" key={field.name}>
            <span className="code-property">{field.name}</span>:{" "}
            {Array.isArray(field.value) ? (
              <>
                [
                {field.value.map((value, index) => (
                  <span key={value}>
                    {index > 0 ? ", " : ""}
                    <span className="code-string">{JSON.stringify(value)}</span>
                  </span>
                ))}
                ]
              </>
            ) : (
              <span className="code-string">{JSON.stringify(field.value)}</span>
            )}
            ,
          </span>
        ))}
        <span className="code-line">{"};"}</span>
      </code>
    </div>
  );
}
