import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import { Tile, TileInput } from 'api';
import { modalDialogConfig } from 'components';
import { AddAppDialog, ADD_APP_TITLE_ID } from '../dialogs/add-app/add-app-dialog';
import { EditAppDialog, EDIT_APP_TITLE_ID } from '../dialogs/edit-app/edit-app-dialog';
import { ResetLayoutDialog, RESET_LAYOUT_TITLE_ID } from '../dialogs/reset-layout/reset-layout-dialog';

/** Opens the add-app, edit-app and reset-layout dialogs from anywhere in the app. */
@Injectable({ providedIn: 'root' })
export class AppDialogs {
  private readonly dialog = inject(Dialog);

  openAdd(prefill?: Partial<TileInput>, trigger?: HTMLElement): void {
    this.dialog.open(
      AddAppDialog,
      modalDialogConfig({
        ariaLabelledBy: ADD_APP_TITLE_ID,
        restoreFocus: trigger ?? true,
        data: { prefill },
      }),
    );
  }

  openEdit(tile: Tile, trigger?: HTMLElement): void {
    this.dialog.open(
      EditAppDialog,
      modalDialogConfig({ ariaLabelledBy: EDIT_APP_TITLE_ID, restoreFocus: trigger ?? true, data: { tile } }),
    );
  }

  openResetLayout(trigger?: HTMLElement): void {
    this.dialog.open(
      ResetLayoutDialog,
      modalDialogConfig({ ariaLabelledBy: RESET_LAYOUT_TITLE_ID, restoreFocus: trigger ?? true }),
    );
  }
}
