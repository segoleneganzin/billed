/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from '@testing-library/dom';
import NewBillUI from '../views/NewBillUI.js';
import BillsUI from '../views/BillsUI.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes.js';
import NewBill from '../containers/NewBill.js';
import mockStore from '../__mocks__/store.js';
import { bills } from '../fixtures/bills.js';
import '@testing-library/jest-dom';

import router from '../app/Router.js';
// TODO new bills test
describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    test('Then envelope icon in vertical layout should be highlighted', async () => {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);

      await waitFor(() => screen.getByTestId('icon-mail'));
      const mailIcon = screen.getByTestId('icon-mail');
      //expect expression
      expect(mailIcon).toHaveClass('active-icon');
    });
    test('Then ...', () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion
    });
  });
});
