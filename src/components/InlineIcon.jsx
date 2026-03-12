function InlineIcon({ svg, className = '', label, size = 18 }) {
  return (
    <span
      className={`ui-inline-icon ${className}`.trim()}
      aria-hidden={label ? undefined : 'true'}
      aria-label={label || undefined}
      style={{ width: `${size}px`, height: `${size}px` }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export default InlineIcon
