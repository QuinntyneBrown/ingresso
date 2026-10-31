import { Scenario } from './scenario';
import { scenario as switchScenario } from './Switch';
import { scenario as menu } from './Menu';
import { scenario as tabs } from './Tabs';
import { scenario as table } from './Table';
import { scenario as card } from './Card';
import { scenario as descriptionList } from './DescriptionList';
import { scenario as list } from './List';
import { scenario as breadcrumb } from './Breadcrumb';
import { scenario as pagination } from './Pagination';
import { scenario as layoutBar } from './LayoutBar';
import { scenario as container } from './Container';
import { scenario as stack } from './Stack';
import { scenario as cluster } from './Cluster';
import { scenario as grid } from './Grid';
import { scenario as link } from './Link';
import { scenario as spinner } from './Spinner';
import { scenario as progressBar } from './ProgressBar';
import { scenario as inlineMessage } from './InlineMessage';
import { scenario as chip } from './Chip';
import { scenario as alert } from './Alert';
import { scenario as appIcon } from './AppIcon';
import { scenario as appTile } from './AppTile';
import { scenario as avatar } from './Avatar';
import { scenario as badge } from './Badge';
import { scenario as button } from './Button';
import { scenario as buttonGroup } from './ButtonGroup';
import { scenario as choice } from './Choice';
import { scenario as dialogShell } from './DialogShell';
import { scenario as divider } from './Divider';
import { scenario as emptyState } from './EmptyState';
import { scenario as errorSummary } from './ErrorSummary';
import { scenario as fieldSet } from './FieldSet';
import { scenario as formField } from './FormField';
import { scenario as formSection } from './FormSection';
import { scenario as icon } from './Icon';
import { scenario as input } from './Input';
import { scenario as logo } from './Logo';
import { scenario as search } from './Search';
import { scenario as siteFooter } from './SiteFooter';
import { scenario as siteHeader } from './SiteHeader';
import { scenario as skeleton } from './Skeleton';
import { scenario as skipLink } from './SkipLink';
import { scenario as statusPage } from './StatusPage';
import { scenario as tileGrid } from './TileGrid';
import { scenario as toast } from './Toast';
import { scenario as tooltip } from './Tooltip';

/** Every scenario, by name. Add one file per component and register it here. */
export const SCENARIOS: Record<string, Scenario> = Object.fromEntries(
  [
    switchScenario,
    menu,
    tabs,
    table,
    card,
    descriptionList,
    list,
    breadcrumb,
    pagination,
    layoutBar,
    container,
    stack,
    cluster,
    grid,
    link,
    spinner,
    progressBar,
    inlineMessage,
    chip,
    alert,
    appIcon,
    appTile,
    avatar,
    badge,
    button,
    buttonGroup,
    choice,
    dialogShell,
    divider,
    emptyState,
    errorSummary,
    fieldSet,
    formField,
    formSection,
    icon,
    input,
    logo,
    search,
    siteFooter,
    siteHeader,
    skeleton,
    skipLink,
    statusPage,
    tileGrid,
    toast,
    tooltip,
  ].map((s) => [s.name, s]),
);
