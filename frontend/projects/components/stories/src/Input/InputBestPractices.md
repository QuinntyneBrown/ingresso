### Best practices

#### Do

- Use the native type that fits: `email`, `url`, `date`, `time`, `number`.
- Wrap it in `ig-form-field` for the label, hint and error.

#### Don't

- Don't restyle the border colour for errors yourself; set `aria-invalid`.
