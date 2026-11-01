import { Dialog } from '@angular/cdk/dialog';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AppRegistered, Tile, TileInput } from 'api';
import { modalDialogConfig } from 'components';
import { AddAppDialog, ADD_APP_TITLE_ID } from '../dialogs/add-app/add-app-dialog';
import { EditAppDialog, EDIT_APP_TITLE_ID } from '../dialogs/edit-app/edit-app-dialog';
import { RegisterAppDialog, REGISTER_APP_TITLE_ID } from '../dialogs/register-app/register-app-dialog';
import { SignOutDialog, SIGN_OUT_TITLE_ID } from '../dialogs/sign-out/sign-out-dialog';
import { ResetLayoutDialog, RESET_LAYOUT_TITLE_ID } from '../dialogs/reset-layout/reset-layout-dialog';

/** Opens the add-app, edit-app, reset-layout, sign-out and register-app dialogs from anywhere in the app. */
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

  openSignOut(trigger?: HTMLElement): void {
    this.dialog.open(
      SignOutDialog,
      modalDialogConfig({ ariaLabelledBy: SIGN_OUT_TITLE_ID, restoreFocus: trigger ?? true }),
    );
  }

  /** Register an app (L2-105); emits the registration when one was made, then completes. */
  openRegisterApp(trigger?: HTMLElement): Observable<AppRegistered | undefined> {
    return this.dialog.open<AppRegistered>(
      RegisterAppDialog,
      modalDialogConfig({ ariaLabelledBy: REGISTER_APP_TITLE_ID, restoreFocus: trigger ?? true }),
    ).closed;
  }
}
