import { DraggableState } from '@/packages/layout/src/hooks/draggable';
import { ToolbarMenu } from '@/packages/ui/components/toolbar-menu';
import TrashIcon from '@/src/icons/trash.svg';
import { ComponentProps } from '@ossinsight-lite/layout/src/components/Components';
import { MenuItem } from '@ossinsight-lite/ui/components/menu';
import { Menu } from '@ossinsight-lite/ui/components/menu/Menu';
import { useWatchItemField, useWatchItemFields } from '@ossinsight-lite/ui/hooks/bind';
import { Consume } from '@ossinsight-lite/ui/hooks/bind/types';
import useRefCallback from '@ossinsight-lite/ui/hooks/ref-callback';
import clsx from 'clsx';
import { Component, ComponentType, forwardRef, ReactElement, Suspense, useContext, useState } from 'react';
import { useNullableDashboardItems } from '../../core/dashboard';
import * as layoutComponents from '../../layout-components';
import widgets from '../../widgets-manifest';
import { DashboardContext } from './context';
import { WidgetCoordinator } from './WidgetCoordinator';

export interface WidgetComponentProps extends ComponentProps, WidgetStateProps {
  className?: string;
  dashboardName?: string;
}

export interface WidgetStateProps {
  editMode: boolean,
  active: boolean,
  onActiveChange: Consume<boolean>
}

type ResolvedComponentType = ComponentType<any>;

const internalCache: Record<string, ResolvedComponentType> = {};

export const WidgetComponent = forwardRef<HTMLDivElement, WidgetComponentProps>(({ ...componentProps }, ref) => {
  let el: ReactElement;

  const { id, draggable, dragging, draggableProps, editMode, active, onActiveChange, className, dashboardName, ...rest } = componentProps;

  const { props: itemProps, name } = useWatchItemFields('library', id, ['name', 'props']);
  const props = { ...rest, ...itemProps };

  if (name.startsWith('internal:')) {
    el = <WidgetCoordinator dashboardName={dashboardName} name={name} _id={id} editMode={editMode} draggable={draggable} props={{ ...props, className: clsx('w-full h-full', props.className) }} ref={ref} />;
  } else {
    if (!widgets[name]) {
      el = <div className="text-sm text-gray-400">Unknown widget {name}, check your repository version.</div>;
    } else {
      el = <WidgetCoordinator dashboardName={dashboardName} name={name} _id={id} editMode={editMode} draggable={draggable} props={{ ...props, className: clsx('w-full h-full', props.className) }} ref={ref} />;
    }
  }

  return (
    <div className={clsx('widget relative rounded-lg bg-white bg-opacity-60 overflow-hidden', className)} {...rest}>
      <Menu name={`widgets.${id}`}>
        <WidgetComponentWrapper
          id={id}
          editMode={editMode}
          dragging={dragging}
          active={active}
          onActiveChange={onActiveChange}
          draggableProps={draggableProps}
        >
          <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-xl text-gray-400">Loading</div>}>
            {el}
          </Suspense>
        </WidgetComponentWrapper>
      </Menu>
    </div>
  );
});
type WidgetState = {
  id: string
  editMode: boolean
  dragging: boolean
  draggableProps?: DraggableState<HTMLDivElement>['domProps']
  active: boolean
  onActiveChange: Consume<boolean>;
}

function WidgetComponentWrapper ({ children, ...props }: WidgetState & { children: ReactElement }) {
  if (props.editMode) {
    return (
      <div className="relative w-full h-full">
        {children}
        <EditingLayer
          {...props}
        />
      </div>
    );
  } else {
    return children;
  }
}

export function EditingLayer ({ id, editMode, dragging, draggableProps, active, onActiveChange }: WidgetState) {
  const { dashboardName } = useContext(DashboardContext);
  const items = useNullableDashboardItems(dashboardName);
  const [hover, setHover] = useState(false);

  const name = useWatchItemField('library', id, 'name');

  const deleteAction = useRefCallback(() => {
    items?.del(id);
  });

  return (
    <div
      className={clsx('absolute left-0 top-0 w-full h-full z-10 bg-gray-700 bg-opacity-0 text-white flex flex-col transition-colors')}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="text-black bg-black bg-opacity-0 opacity-20 hover:bg-opacity-30 hover:opacity-100 hover:text-white transition-all">
        <ToolbarMenu
          className="flex justify-end items-center"
          onMouseDown={e => console.log(e)}
          name={`widgets.${id}`}
          auto={false}
          data-layer-item
        >
          <MenuItem
            key="delete"
            id="delete"
            text={<TrashIcon className="text-red-500" />}
            action={deleteAction}
            order={100}
          />
        </ToolbarMenu>
      </div>
      <div className="flex-1 justify-stretch cursor-pointer" {...draggableProps} />
    </div>
  );
}
