import { useState } from 'react'
import { Tooltip, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components'
import {
  BotRegular,
  ChevronDownRegular,
  ChevronRightRegular,
  CloudSyncRegular,
  DocumentBulletListRegular,
  DocumentSearchRegular,
  GridDotsRegular,
  PanelLeftContractRegular,
  PanelLeftExpandRegular,
  PlugConnectedRegular,
  SearchRegular,
} from '@fluentui/react-icons'

/**
 * Ordered by the QA workflow: Connect -> Import -> Analyze -> Improve -> Validate.
 * ADO Connection is the landing page.
 * Single-item groups render as top-level links under their heading.
 */
export const navSections = [
  {
    key: 'azure-devops',
    label: 'Azure DevOps',
    items: [
      { key: 'ado-connection', label: 'ADO Connection', icon: PlugConnectedRegular },
      { key: 'import-test-cases', label: 'Import Test Cases', icon: CloudSyncRegular },
    ],
  },
  {
    key: 'quality-analysis',
    label: 'Quality Analysis',
    items: [
      { key: 'duplicate-finder', label: 'Duplicate Test Cases', icon: SearchRegular },
      { key: 'missing-steps', label: 'Missing Steps', icon: DocumentBulletListRegular },
    ],
  },
  {
    key: 'ai-assistant',
    label: 'AI Assistant',
    items: [
      { key: 'generate-steps', label: 'Generate Test Steps', icon: BotRegular },
    ],
  },
  {
    key: 'test-design',
    label: 'Test Design Analysis',
    items: [
      { key: 'brd-analyzer', label: 'Test Case Generator', icon: DocumentSearchRegular },
    ],
  },
]

export const navItems = navSections.flatMap((section) => section.items)

function sectionKeyFor(pageKey) {
  return navSections.find((section) => section.items.some((item) => item.key === pageKey))?.key
}

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    height: '100%',
    width: '272px',
    paddingTop: tokens.spacingVerticalM,
    paddingBottom: tokens.spacingVerticalM,
    paddingInline: tokens.spacingHorizontalS,
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    transitionProperty: 'width',
    transitionDuration: tokens.durationSlow,
    transitionTimingFunction: tokens.curveEasyEase,
    overflowX: 'hidden',
    overflowY: 'auto',
  },
  collapsed: {
    width: '60px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: tokens.spacingHorizontalS,
    minHeight: '36px',
    paddingInline: tokens.spacingHorizontalXS,
    marginBottom: tokens.spacingVerticalM,
  },
  caption: {
    ...shorthands.overflow('hidden'),
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: tokens.colorNeutralForeground3,
  },
  toggle: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '32px',
    height: '32px',
    ...shorthands.border('0'),
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground2,
    cursor: 'pointer',
    fontSize: '18px',
    transitionProperty: 'background-color, color',
    transitionDuration: tokens.durationFaster,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
      color: tokens.colorNeutralForeground1,
    },
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXXS,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXXS,
    marginBottom: tokens.spacingVerticalXS,
  },
  groupButton: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalS,
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '32px',
    paddingInline: tokens.spacingHorizontalS,
    ...shorthands.border('0'),
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    textAlign: 'left',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
      color: tokens.colorNeutralForeground2,
    },
  },
  groupLabel: {
    flexGrow: 1,
    ...shorthands.overflow('hidden'),
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  chevron: {
    display: 'inline-flex',
    fontSize: '12px',
    transitionProperty: 'transform',
    transitionDuration: tokens.durationFaster,
  },
  item: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '38px',
    paddingInline: tokens.spacingHorizontalS,
    ...shorthands.border('0'),
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: 'transparent',
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyBase,
    fontSize: tokens.fontSizeBase300,
    lineHeight: tokens.lineHeightBase300,
    textAlign: 'left',
    cursor: 'pointer',
    transitionProperty: 'background-color, color, transform',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
      color: tokens.colorNeutralForeground1,
      transform: 'translateX(2px)',
    },
    ':focus-visible': {
      outline: `${tokens.strokeWidthThick} solid ${tokens.colorStrokeFocus2}`,
      outlineOffset: '-2px',
    },
  },
  itemNested: {
    paddingInlineStart: tokens.spacingHorizontalXXL,
  },
  itemCollapsed: {
    justifyContent: 'center',
    columnGap: 0,
    paddingInline: 0,
  },
  itemSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontWeight: tokens.fontWeightSemibold,
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2Hover,
      color: tokens.colorBrandForeground2,
    },
  },
  indicator: {
    position: 'absolute',
    insetInlineStart: 0,
    top: '50%',
    width: '3px',
    height: 0,
    transform: 'translateY(-50%)',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorBrandStroke1,
    transitionProperty: 'height',
    transitionDuration: tokens.durationNormal,
  },
  indicatorSelected: {
    height: '18px',
  },
  icon: {
    display: 'inline-flex',
    flexShrink: 0,
    fontSize: '20px',
  },
  label: {
    ...shorthands.overflow('hidden'),
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
  },
  divider: {
    height: '1px',
    marginBlock: tokens.spacingVerticalXS,
    marginInline: tokens.spacingHorizontalS,
    backgroundColor: tokens.colorNeutralStroke2,
  },
})

function Sidebar({ activePage, onNavigate }) {
  const styles = useStyles()
  const [collapsed, setCollapsed] = useState(false)
  const [closedGroups, setClosedGroups] = useState({})
  const activeSection = sectionKeyFor(activePage)

  const renderItem = (item, nested) => {
    const selected = activePage === item.key
    const Icon = item.icon ?? GridDotsRegular

    const button = (
      <button
        key={item.key}
        type="button"
        className={mergeClasses(
          styles.item,
          nested && !collapsed && styles.itemNested,
          collapsed && styles.itemCollapsed,
          selected && styles.itemSelected,
        )}
        aria-current={selected ? 'page' : undefined}
        onClick={() => onNavigate(item.key)}
      >
        <span
          aria-hidden="true"
          className={mergeClasses(styles.indicator, selected && styles.indicatorSelected)}
        />
        <span className={styles.icon} aria-hidden="true">
          <Icon />
        </span>
        {!collapsed && <span className={styles.label}>{item.label}</span>}
      </button>
    )

    return collapsed || item.description ? (
      <Tooltip
        key={item.key}
        content={item.description ?? item.label}
        relationship="label"
        positioning="after"
      >
        {button}
      </Tooltip>
    ) : (
      button
    )
  }

  return (
    <aside
      className={mergeClasses(styles.root, collapsed && styles.collapsed)}
      aria-label="Primary navigation"
    >
      <div className={styles.header}>
        {!collapsed && <span className={styles.caption}>Navigation</span>}
        <Tooltip
          content={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          relationship="label"
          positioning="after"
        >
          <button
            type="button"
            className={styles.toggle}
            aria-expanded={!collapsed}
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <PanelLeftExpandRegular /> : <PanelLeftContractRegular />}
          </button>
        </Tooltip>
      </div>

      <nav className={styles.nav}>
        {navSections.map((section, index) => {
          const isGroup = section.items.length > 1
          // The group holding the active page always stays open.
          const open = section.key === activeSection || !closedGroups[section.key]

          return (
            <div key={section.key} className={styles.section}>
              {index > 0 && collapsed && <span className={styles.divider} aria-hidden="true" />}

              {section.label && !collapsed && (
                <button
                  type="button"
                  className={styles.groupButton}
                  aria-expanded={isGroup ? open : undefined}
                  onClick={() =>
                    isGroup &&
                    setClosedGroups((current) => ({ ...current, [section.key]: open }))
                  }
                >
                  <span className={styles.groupLabel}>{section.label}</span>
                  {isGroup && (
                    <span className={styles.chevron} aria-hidden="true">
                      {open ? <ChevronDownRegular /> : <ChevronRightRegular />}
                    </span>
                  )}
                </button>
              )}

              {(!isGroup || open || collapsed) &&
                section.items.map((item) => renderItem(item, isGroup))}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
