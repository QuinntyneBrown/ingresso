import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type ClusterJustify = 'start' | 'between' | 'end';

/** A wrapping row of items with a token gap, vertically centred; never forced onto one line. */
@Component({
  selector: 'ig-cluster',
  template: '<ng-content />',
  styleUrl: './cluster.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class]': 'classes()' },
})
export class Cluster {
  readonly justify = input<ClusterJustify>('start');
  protected readonly classes = computed(() =>
    this.justify() === 'start' ? 'cluster' : `cluster cluster--${this.justify()}`,
  );
}
