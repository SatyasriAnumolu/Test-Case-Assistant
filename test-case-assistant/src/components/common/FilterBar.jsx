import {
  Button,
  Dropdown,
  Option,
  SearchBox,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { DismissRegular, FilterRegular } from '@fluentui/react-icons'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  icon: {
    display: 'inline-flex',
    color: tokens.colorNeutralForeground3,
    paddingInline: tokens.spacingHorizontalXS,
  },
  dropdown: {
    minWidth: '150px',
  },
  search: {
    flexGrow: 1,
    minWidth: '200px',
  },
})

/**
 * filters: [{ key, placeholder, options: string[], allLabel }]
 */
function FilterBar({
  filters = [],
  values = {},
  onChange,
  search,
  onSearchChange,
  searchPlaceholder = 'Search',
  onReset,
}) {
  const styles = useStyles()
  const isDirty =
    Boolean(search) ||
    filters.some((filter) => {
      const allLabel = filter.allLabel ?? 'All'
      return values[filter.key] && values[filter.key] !== allLabel
    })

  return (
    <div className={styles.root} role="search">
      <span className={styles.icon} aria-hidden="true">
        <FilterRegular />
      </span>

      {filters.map((filter) => {
        const allLabel = filter.allLabel ?? 'All'
        const value = values[filter.key] ?? allLabel

        return (
          <Dropdown
            key={filter.key}
            className={styles.dropdown}
            placeholder={filter.placeholder}
            value={value}
            selectedOptions={[value]}
            onOptionSelect={(_event, data) => onChange?.(filter.key, data.optionValue)}
            aria-label={filter.placeholder}
          >
            {[allLabel, ...filter.options].map((option) => (
              <Option key={option} value={option}>
                {option}
              </Option>
            ))}
          </Dropdown>
        )
      })}

      {onSearchChange && (
        <SearchBox
          className={styles.search}
          value={search}
          placeholder={searchPlaceholder}
          onChange={(_event, data) => onSearchChange(data.value)}
          aria-label={searchPlaceholder}
        />
      )}

      {onReset && (
        <Button appearance="subtle" icon={<DismissRegular />} disabled={!isDirty} onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  )
}

export default FilterBar
