import * as React from 'react';
import {Checkbox} from 'argo-ui/v2';
import {ApplicationTree, HealthStatusCode, HealthStatuses, SyncStatusCode, SyncStatuses} from '../../../shared/models';
import {AppDetailsPreferences, services} from '../../../shared/services';
import {Context} from '../../../shared/context';
import {Filter, FiltersGroup} from '../filter/filter';
import {ComparisonStatusIcon, HealthStatusIcon} from '../utils';
import {resources} from '../resources';
import * as models from '../../../shared/models';

const uniq = (value: string, index: number, self: string[]) => self.indexOf(value) === index;

const KIND_INCLUDE_PREFIX = 'kind';
const KIND_EXCLUDE_PREFIX = 'kind!';

function toOption(label: string) {
    return {label};
}

export interface FiltersProps {
    children?: React.ReactNode;
    pref: AppDetailsPreferences;
    tree: ApplicationTree;
    resourceNodes: models.ResourceStatus[];
    onSetFilter: (items: string[]) => void;
    onClearFilter: () => void;
    collapsed?: boolean;
}

export const Filters = (props: FiltersProps) => {
    const ctx = React.useContext(Context);

    const {pref, tree, onSetFilter} = props;

    const onClearFilter = () => {
        setLoading(true);
        props.onClearFilter();
    };

    const resourceFilter = pref.resourceFilter || [];
    const removePrefix = (prefix: string) => (v: string) => v.replace(prefix + ':', '');

    const [groupedFilters, setGroupedFilters] = React.useState<{[key: string]: string}>({});
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const update: {[key: string]: string} = {};
        (resourceFilter || []).forEach(pair => {
            const tmp = pair.split(':');
            if (tmp.length === 2) {
                const prefix = tmp[0];
                const cur = update[prefix];
                update[prefix] = `${cur ? cur + ',' : ''}${pair}`;
            }
        });
        setGroupedFilters(update);
        setLoading(false);
    }, [resourceFilter, loading]);

    const setFilters = (prefix: string, values: string[]) => {
        const groups = {...groupedFilters};
        groups[prefix] = values.map(v => `${prefix}:${v}`).join(',');
        let strings: string[] = [];
        Object.keys(groups).forEach(g => {
            strings = strings.concat(groups[g].split(',').filter(f => f !== ''));
        });
        onSetFilter(strings);
    };

    const ResourceFilter = (p: {
        label: string;
        prefix: string;
        options: {label: string}[];
        abbreviations?: Map<string, string>;
        field?: boolean;
        radio?: boolean;
        titleAppend?: React.ReactNode;
        selectedModifierClass?: string;
    }) => {
        return loading ? (
            <div>Loading...</div>
        ) : (
            <Filter
                label={p.label}
                selected={selectedFor(p.prefix)}
                setSelected={v => setFilters(p.prefix, v)}
                options={p.options}
                abbreviations={p.abbreviations}
                field={!!p.field}
                radio={!!p.radio}
                titleAppend={p.titleAppend}
                selectedModifierClass={p.selectedModifierClass}
            />
        );
    };

    // Kinds can be included (default) or excluded. Toggling moves any currently selected
    // kinds to the other prefix so switching modes doesn't silently drop the selection.
    const [kindExcludeMode, setKindExcludeMode] = React.useState(() => resourceFilter.some(f => f.startsWith(`${KIND_EXCLUDE_PREFIX}:`)));

    const toggleKindExcludeMode = () => {
        const fromPrefix = kindExcludeMode ? KIND_EXCLUDE_PREFIX : KIND_INCLUDE_PREFIX;
        const toPrefix = kindExcludeMode ? KIND_INCLUDE_PREFIX : KIND_EXCLUDE_PREFIX;
        const currentValues = selectedFor(fromPrefix);

        if (currentValues.length > 0) {
            const groups = {...groupedFilters};
            delete groups[fromPrefix];
            groups[toPrefix] = currentValues.map(v => `${toPrefix}:${v}`).join(',');
            let strings: string[] = [];
            Object.keys(groups).forEach(g => {
                strings = strings.concat(groups[g].split(',').filter(f => f !== ''));
            });
            onSetFilter(strings);
        }
        setKindExcludeMode(!kindExcludeMode);
    };

    const KindModeToggle = () => (
        <div
            className={`filter__header__mode-toggle ${kindExcludeMode ? 'filter__header__mode-toggle--exclude' : ''}`}
            onClick={toggleKindExcludeMode}
            title={kindExcludeMode ? 'Hiding the selected kinds. Click to show only the selected kinds instead.' : 'Showing only the selected kinds. Click to hide the selected kinds instead.'}>
            <i className={`fa ${kindExcludeMode ? 'fa-minus-circle' : 'fa-plus-circle'}`} />
            {kindExcludeMode ? 'EXCLUDE' : 'INCLUDE'}
        </div>
    );

    // we need to include ones that might have been filter in other apps that do not apply to the current app,
    // otherwise the user will not be able to clear them from this panel
    const alreadyFilteredOn = (prefix: string) => resourceFilter.filter(f => f.startsWith(prefix + ':')).map(removePrefix(prefix));

    const kinds = tree.nodes
        .map(x => x.kind)
        .concat(alreadyFilteredOn(KIND_INCLUDE_PREFIX))
        .concat(alreadyFilteredOn(KIND_EXCLUDE_PREFIX))
        .filter(uniq)
        .sort();

    const names = tree.nodes
        .map(x => x.name)
        .concat(alreadyFilteredOn('name'))
        .filter(uniq)
        .sort();

    const namespaces = tree.nodes
        .map(x => x.namespace)
        .filter(x => !!x)
        .concat(alreadyFilteredOn('namespace'))
        .filter(uniq)
        .sort();

    const selectedFor = (prefix: string) => {
        return groupedFilters[prefix] ? groupedFilters[prefix].split(',').map(removePrefix(prefix)) : [];
    };

    const getOptionCount = (label: string, filterType: string): number => {
        switch (filterType) {
            case 'Sync':
                return props.resourceNodes.filter(res => res.status === SyncStatuses[label]).length;
            case 'Health':
                return props.resourceNodes.filter(res => res.health?.status === HealthStatuses[label]).length;
            case 'Kind':
                return props.resourceNodes.reduce((count, res) => (res.group && label === 'Pod' ? res.group.length : res.kind === label ? count + 1 : count), 0);
            default:
                return 0;
        }
    };

    return (
        <FiltersGroup title='Resource filters' content={props.children} appliedFilter={pref.resourceFilter} onClearFilter={onClearFilter} collapsed={props.collapsed}>
            {ResourceFilter({label: 'NAME', prefix: 'name', options: names.map(toOption), field: true})}
            {ResourceFilter({
                label: 'KINDS',
                prefix: kindExcludeMode ? KIND_EXCLUDE_PREFIX : KIND_INCLUDE_PREFIX,
                options: kinds.map(label => ({
                    label,
                    count: getOptionCount(label, 'Kind')
                })),
                abbreviations: resources,
                field: true,
                titleAppend: <KindModeToggle />,
                selectedModifierClass: kindExcludeMode ? 'filter__item--exclude' : undefined
            })}
            {ResourceFilter({
                label: 'SYNC STATUS',
                prefix: 'sync',
                options: ['Synced', 'OutOfSync'].map(label => ({
                    label,
                    count: getOptionCount(label, 'Sync'),
                    icon: <ComparisonStatusIcon status={label as SyncStatusCode} noSpin={true} />
                }))
            })}
            {ResourceFilter({
                label: 'HEALTH STATUS',
                prefix: 'health',
                options: ['Progressing', 'Suspended', 'Healthy', 'Degraded', 'Missing', 'Unknown'].map(label => ({
                    label,
                    count: getOptionCount(label, 'Health'),
                    icon: <HealthStatusIcon state={{status: label as HealthStatusCode, message: ''}} noSpin={true} />
                }))
            })}
            {namespaces.length > 1 && ResourceFilter({label: 'NAMESPACES', prefix: 'namespace', options: (namespaces || []).filter(l => l && l !== '').map(toOption), field: true})}
            {(tree.orphanedNodes || []).length > 0 && (
                <div className={`filter filter__item ${pref.orphanedResources ? 'filter__item--selected' : ''}`}>
                    <Checkbox
                        value={!!pref.orphanedResources}
                        onChange={val => {
                            ctx.navigation.goto('.', {orphaned: val}, {replace: true});
                            services.viewPreferences.updatePreferences({appDetails: {...pref, orphanedResources: val}});
                        }}
                        style={{
                            marginRight: '8px',
                            marginLeft: '8px'
                        }}
                    />
                    <div className='filter__item__label'>Show Orphaned</div>
                </div>
            )}
        </FiltersGroup>
    );
};
