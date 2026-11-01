import { ChangeDetectionStrategy, Component, computed, inject, OnInit, output, signal } from '@angular/core';
import { Device, SESSIONS_API } from 'api';
import { Alert, Badge, Button, Card, List, ListItem, Skeleton } from 'components';
import { deviceLabel } from '../../shared/relative-time';

type Load = 'loading' | 'ready' | 'failed';

/** What End session hands the page: the device (or every other one) and the button focus returns to. */
export interface DeviceAction {
  device: Device | 'others';
  others: Device[];
  trigger: HTMLElement;
}

/** Settings → Devices: where the person is signed in, with End session (L2-132 to L2-134). */
@Component({
  selector: 'ig-devices-card',
  imports: [Alert, Badge, Button, Card, List, ListItem, Skeleton],
  template: `
    <section ig-card title="Devices">
      @if (others().length) {
        <button
          slot="actions"
          ig-button
          type="button"
          (click)="end.emit({ device: 'others', others: others(), trigger: $any($event.currentTarget) })"
        >
          Sign out of all other devices
        </button>
      }
      <p class="lead">Where you’re signed in to ingresso. End any session you don’t recognise.</p>
      @switch (load()) {
        @case ('loading') {
          <div class="loading" aria-busy="true" aria-label="Loading your devices">
            <ig-skeleton /><ig-skeleton />
          </div>
        }
        @case ('failed') {
          <ig-alert kind="danger" title="We couldn’t load your devices" announce="alert" [actions]="retry">
            Try again in a moment.
          </ig-alert>
        }
        @default {
          <ul ig-list surface aria-label="Signed-in devices">
            @for (device of devices(); track device.id) {
              <li ig-list-item wrap [title]="device.device" [meta]="when(device)">
                @if (device.current) {
                  <ig-badge slot="action" kind="info">This device</ig-badge>
                } @else {
                  <button
                    slot="action"
                    ig-button
                    size="sm"
                    type="button"
                    [attr.aria-label]="'End the session on ' + device.device"
                    (click)="end.emit({ device, others: others(), trigger: $any($event.currentTarget) })"
                  >
                    End session
                  </button>
                }
              </li>
            }
          </ul>
          @if (!others().length) {
            <p class="lead">You’re not signed in anywhere else.</p>
          }
        }
      }
    </section>
  `,
  styles: `
    .lead {
      color: var(--colorNeutralForeground2);
      margin-bottom: var(--spacingVerticalL);
    }
    ul + .lead {
      margin: var(--spacingVerticalL) 0 0;
    }
    .loading {
      display: grid;
      gap: var(--spacingVerticalS);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DevicesCard implements OnInit {
  private readonly api = inject(SESSIONS_API);
  protected readonly load = signal<Load>('loading');
  protected readonly devices = signal<Device[]>([]);
  protected readonly others = computed(() =>
    this.load() === 'ready' ? this.devices().filter((d) => !d.current) : [],
  );
  protected readonly retry = [{ label: 'Try again', run: () => this.reload() }];

  /** End session, or Sign out of all other devices, was chosen; the page asks first. */
  readonly end = output<DeviceAction>();

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.load.set('loading');
    this.api.list().subscribe({
      next: (devices) => {
        this.devices.set(devices);
        this.load.set('ready');
      },
      error: () => this.load.set('failed'),
    });
  }

  protected when(device: Device): string {
    return deviceLabel(device.signedInAt, device.lastActiveAt, device.current);
  }
}
