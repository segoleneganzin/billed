/**
 * @jest-environment jsdom
 */
import { fireEvent, screen, waitFor } from '@testing-library/dom';
import '@testing-library/jest-dom';
import BillsUI from '../views/BillsUI.js';
import Bills from '../containers/Bills.js';
import { bills } from '../fixtures/bills.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockStore from '../__mocks__/store';

import router from '../app/Router.js';

jest.mock('../app/store', () => mockStore);

describe('Given I am a user connected as an employee', () => {
  describe('When I am on Bills page but it is loading', () => {
    test('Then, Loading page should be rendered', () => {
      document.body.innerHTML = BillsUI({ loading: true });
      expect(screen.getAllByText('Loading...')).toBeTruthy();
    });
  });
  describe('When I am on Bills page but back-end send an error message', () => {
    test('Then, Error page should be rendered', () => {
      document.body.innerHTML = BillsUI({ error: 'some error message' });
      expect(screen.getAllByText('Erreur')).toBeTruthy();
    });
  });
  describe('When I am on Bills page and there are no bills', () => {
    test('Then, no bills should be shown', () => {
      document.body.innerHTML = BillsUI({ data: [] });
      const sampleBillsTable = screen.queryByTestId('tbody');
      expect(sampleBillsTable.childElementCount).not.toBeGreaterThan(0);
    });
  });
  describe('When I am on Bills Page', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
        })
      );
    });
    test('Then bill icon in vertical layout should be highlighted', async () => {
      // it's necessary to simulate router because vertical layout isn't on BillsUI
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId('icon-window'));
      expect(screen.getByTestId('icon-window')).toHaveClass('active-icon');
    });
    test('Then bills should be ordered from earliest to latest', () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    describe('When I click on eye button', () => {
      test('Then a modal should open', async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const billsPage = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });
        document.body.innerHTML = BillsUI({ data: bills });

        const iconEye = screen.getAllByTestId('icon-eye');
        const handleClickIconEye = jest.fn(billsPage.handleClickIconEye);
        const modale = document.getElementById('modaleFile');

        $.fn.modal = jest.fn(() => modale.classList.add('show')); //mock of jquery modal

        iconEye.forEach((icon) => {
          icon.addEventListener('click', () => handleClickIconEye(icon));
          fireEvent.click(icon);
          expect(handleClickIconEye).toHaveBeenCalled();
          expect(modale).toHaveClass('show');
        });
      });
    });
    describe('When I click on new bill button', () => {
      test('Then, I should be on new bill form', async () => {
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const billsPage = new Bills({
          document,
          onNavigate,
          store: null,
          localStorage: window.localStorage,
        });
        document.body.innerHTML = BillsUI({ data: { bills } });
        const handleShowBillForm = jest.fn((e) =>
          billsPage.handleClickNewBill()
        );
        const iconNewBill = screen.getByTestId('btn-new-bill');
        iconNewBill.addEventListener('click', handleShowBillForm);
        fireEvent.click(iconNewBill);
        expect(handleShowBillForm).toHaveBeenCalled();
        await waitFor(() => screen.getByTestId(`form-new-bill`));
        expect(screen.getByTestId(`form-new-bill`)).toBeTruthy();
      });
    });
  });
});

// integration test GET
describe('Given I am a user connected as an employee', () => {
  beforeEach(() => {
    jest.spyOn(mockStore, 'bills');
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      'user',
      JSON.stringify({
        type: 'Employee',
        email: 'e@e',
      })
    );
    const root = document.createElement('div');
    root.setAttribute('id', 'root');
    document.body.appendChild(root);
    router();
  });
  describe('When I navigate to Bills page', () => {
    test('fetches bills from mock API GET', async () => {
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText('Mes notes de frais'));
      const billsPageTitle = screen.getByText('Mes notes de frais');
      expect(billsPageTitle).toBeTruthy();
      const newBillBtn = screen.getByTestId('btn-new-bill');
      expect(newBillBtn).toBeTruthy();
      const billsTable = screen.getByTestId('tbody');
      expect(billsTable).toBeTruthy();
      // verify if all test bill's name are presents
      const bills1 = screen.getByText('encore');
      expect(bills1).toBeTruthy();
      const bills2 = screen.getByText('test1');
      expect(bills2).toBeTruthy();
      const bills3 = screen.getByText('test3');
      expect(bills3).toBeTruthy();
      const bills4 = screen.getByText('test2');
      expect(bills4).toBeTruthy();
      const pendingStatus = screen.getAllByText('En attente');
      expect(pendingStatus).toHaveLength(1);
      const refusedStatus = screen.getAllByText('Refused');
      expect(refusedStatus).toHaveLength(2);
      const acceptedStatus = screen.getAllByText('Accepté');
      expect(acceptedStatus).toHaveLength(1);
    });

    describe('When an error occurs on API', () => {
      test('fetches bills from an API and fails with 404 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 404'));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        expect(mockStore.bills).toHaveBeenCalled();
        expect(screen.getByText(/Erreur 404/)).toBeTruthy();
      });

      test('fetches bills from an API and fails with 500 message error', async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error('Erreur 500'));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        expect(mockStore.bills).toHaveBeenCalled();
        expect(screen.getByText(/Erreur 500/)).toBeTruthy();
      });
    });
  });
});
