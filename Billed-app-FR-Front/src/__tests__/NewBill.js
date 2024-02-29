/**
 * @jest-environment jsdom
 */
import { screen, waitFor, fireEvent } from '@testing-library/dom';
import '@testing-library/jest-dom';
import NewBillUI from '../views/NewBillUI.js';
import NewBill from '../containers/NewBill.js';
import { ROUTES, ROUTES_PATH } from '../constants/routes.js';
import { localStorageMock } from '../__mocks__/localStorage.js';
import mockStore from '../__mocks__/store.js';

import router from '../app/Router.js';

describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
      });
      localStorage.setItem(
        'user',
        JSON.stringify({ type: 'Employee', email: 'e@e' })
      );
    });
    test('Then envelope icon in vertical layout should be highlighted', async () => {
      // it's necessary to simulate router because vertical layout isn't on NewBillUI
      const root = document.createElement('div');
      root.setAttribute('id', 'root');
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.NewBill);
      await waitFor(() => screen.getByTestId('icon-mail'));
      expect(screen.getByTestId('icon-mail')).toHaveClass('active-icon');
    });
    test('Then form should be display with all input', () => {
      document.body.innerHTML = NewBillUI();
      expect(screen.getByText('Envoyer une note de frais')).toBeTruthy();
      expect(screen.getByTestId(`form-new-bill`)).toBeTruthy();
      expect(screen.getAllByTestId('expense-type')).toBeTruthy();
      expect(screen.getAllByTestId('expense-name')).toBeTruthy();
      expect(screen.getAllByTestId('datepicker')).toBeTruthy();
      expect(screen.getAllByTestId('amount')).toBeTruthy();
      expect(screen.getAllByTestId('vat')).toBeTruthy();
      expect(screen.getAllByTestId('pct')).toBeTruthy();
      expect(screen.getAllByTestId('commentary')).toBeTruthy();
      expect(screen.getAllByTestId('file')).toBeTruthy();
      expect(document.querySelector('#btn-send-bill')).toBeTruthy();
    });
    describe('When I handleChange file', () => {
      describe('When I set valid format', () => {
        test('Then the file is charged without custom validity', () => {
          const newBillTest = new NewBill({
            document,
            onNavigate,
            store: mockStore,
            localStorage: window.localStorage,
          });
          const mockEvent = {
            preventDefault: jest.fn(),
            target: {
              files: [new File(['image'], 'image.jpg', { type: 'image/jpg' })],
              value: 'C:\\fakepath\\image.jpg',
              setCustomValidity: jest.fn(),
            },
          };
          newBillTest.handleChangeFile(mockEvent);
          expect(mockEvent.target.setCustomValidity).toHaveBeenCalledWith('');
        });
      });
      describe('When I set invalid format', () => {
        test('Then the file is charged with custom validity', () => {
          const newBillTest = new NewBill({
            document,
            onNavigate,
            store: mockStore,
            localStorage: window.localStorage,
          });
          const mockEvent = {
            preventDefault: jest.fn(),
            target: {
              files: [
                new File(['image'], 'image.webp', { type: 'image/webp' }),
              ],
              value: 'C:\\fakepath\\image.webp',
              setCustomValidity: jest.fn(),
            },
          };
          newBillTest.handleChangeFile(mockEvent);
          expect(mockEvent.target.setCustomValidity).toHaveBeenCalledWith(
            'Veuillez choisir un format valide (jpg, jpeg ou png)'
          );
        });
      });
    });
    describe('When I click on submit button', () => {
      describe('When datas are valid', () => {
        test('Then the handleSubmit should be called and navigate to bills page', async () => {
          // It is not possible to test the validity of the data,
          // as the submit is intercepted by the validator on the html
          // side with the required.
          // The data should have been validated in the submit function for permitted testing.
          // here we just can see that there are no error with data value into console
          const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname });
          };
          const newBill = new NewBill({
            document,
            onNavigate,
            store: mockStore,
            localStorage: window.localStorage,
          });
          const querySelectorMock = jest.fn().mockImplementation((selector) => {
            if (selector === 'input[data-testid="datepicker"]') {
              return { value: '2024-02-28' };
            } else if (selector === 'select[data-testid="expense-type"]') {
              return { value: 'Transports' };
            } else if (selector === 'input[data-testid="expense-name"]') {
              return { value: 'Test' };
            } else if (selector === 'input[data-testid="amount"]') {
              return { value: 100 };
            } else if (selector === 'input[data-testid="vat"]') {
              return { value: '10' };
            } else if (selector === 'input[data-testid="pct"]') {
              return { value: 20 };
            } else if (selector === 'textarea[data-testid="commentary"]') {
              return { value: 'Test commentaire' };
            }
          });
          const mockEventFile = {
            preventDefault: jest.fn(),
            target: {
              files: [new File(['image'], 'test.jpg', { type: 'image/jpg' })],
              value: 'https://localhost:3456/images/test.jpg',
              setCustomValidity: jest.fn(),
            },
          };
          const mockEvent = {
            preventDefault: jest.fn(),
            target: {
              querySelector: querySelectorMock,
            },
          };
          newBill.handleChangeFile(mockEventFile);
          const handleSubmit = jest.fn((e) => newBill.handleSubmit(mockEvent));
          const form = screen.getByTestId('form-new-bill');
          form.addEventListener('submit', handleSubmit);
          fireEvent.submit(form);
          expect(handleSubmit).toHaveBeenCalled();
          expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
          await waitFor(() => screen.getByText('Mes notes de frais'));
          expect(screen.getByText('Mes notes de frais')).toBeTruthy();
          expect(screen.getByTestId('btn-new-bill')).toBeTruthy();
        });
      });
      // describe('When fields are empty', () => {
      //   test('Then handleSubmit not to have been called', () => {
      //     const onNavigate = (pathname) => {
      //       document.body.innerHTML = ROUTES({ pathname });
      //     };
      //     document.body.innerHTML = NewBillUI({
      //       data: bills,
      //     });
      //     const newBill = new NewBill({
      //       document,
      //       onNavigate,
      //       store: mockStore,
      //       localStorage: window.localStorage,
      //     });
      //     const form = screen.getByTestId('form-new-bill');
      //     const handleSubmit = jest.fn((e) => newBill.handleSubmit);
      //     form.addEventListener('submit', handleSubmit);
      //     fireEvent.submit(form);
      //     expect(handleSubmit).toHaveBeenCalledTimes(1);
      //     expect(form).toBeVisible();
      //   });
      // });
    });
  });
});

// integration test POST
describe('Given I am connected as an employee', () => {
  describe('When I am on NewBill Page', () => {
    describe('When I charge file in valid format', () => {
      test('Then it should create a bill to mock API POST', async () => {
        jest.spyOn(mockStore, 'bills');
        const newBillFile = {
          fileUrl: 'https://localhost:3456/images/test.jpg',
          key: '1234',
        };
        const postNewBill = await mockStore.bills().create(newBillFile);
        expect(mockStore.bills).toHaveBeenCalled();
        expect(postNewBill).toStrictEqual(newBillFile);
      });
    });
    describe('When I submit newBill', () => {
      test('Then it should update the bill to mock API POST', async () => {
        const bill = {
          id: '47qAXb6fIm2zOKkLzMro',
          vat: '80',
          fileUrl:
            'https://firebasestorage.googleapis.com/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=c1640e12-a24b-4b11-ae52-529112e9602a',
          status: 'pending',
          type: 'Hôtel et logement',
          commentary: 'séminaire billed',
          name: 'encore',
          fileName: 'preview-facture-free-201801-pdf-1.jpg',
          date: '2004-04-04',
          amount: 400,
          commentAdmin: 'ok',
          email: 'a@a',
          pct: 20,
        };
        const postNewBill = await mockStore.bills().update(bill);
        expect(mockStore.bills).toHaveBeenCalled();
        expect(postNewBill).toStrictEqual(bill);
      });
    });
  });

  // there's no error handling in the view, so we spy on the console (catch error case)
  describe('When an error occurs on API', () => {
    beforeEach(() => {
      window.localStorage.setItem(
        'user',
        JSON.stringify({
          type: 'Employee',
          email: 'e@e',
        })
      );
    });
    test('create bill from an API and fails with 404 message error', async () => {
      const post = jest.spyOn(console, 'error');
      document.body.innerHTML = NewBillUI();
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: jest.fn(() => Promise.reject(new Error('404 Not Found'))),
        };
      });
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });
      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          files: [new File(['image'], 'image.jpg', { type: 'image/jpg' })],
          value: 'C:\\fakepath\\image.jpg',
          setCustomValidity: jest.fn(),
        },
      };
      newBill.handleChangeFile(mockEvent);
      await new Promise(process.nextTick);
      expect(post).toBeCalledWith(new Error('404 Not Found'));
    });
    test('create bill from an API and fails with 500 message error', async () => {
      const post = jest.spyOn(console, 'error');
      document.body.innerHTML = NewBillUI();
      mockStore.bills.mockImplementationOnce(() => {
        return {
          create: jest.fn(() =>
            Promise.reject(new Error('500 Internal Server Error'))
          ),
        };
      });
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });
      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          files: [new File(['image'], 'image.jpg', { type: 'image/jpg' })],
          value: 'C:\\fakepath\\image.jpg',
          setCustomValidity: jest.fn(),
        },
      };
      newBill.handleChangeFile(mockEvent);
      await new Promise(process.nextTick);
      expect(post).toBeCalledWith(new Error('500 Internal Server Error'));
    });
    test('update bill from an API and fails with 404 message error', async () => {
      const post = jest.spyOn(console, 'error');
      document.body.innerHTML = NewBillUI();
      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: jest.fn(() => Promise.reject(new Error('404 Not Found'))),
        };
      });
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });
      const form = screen.getByTestId('form-new-bill');
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener('submit', handleSubmit);
      fireEvent.submit(form);
      await new Promise(process.nextTick);
      expect(post).toBeCalledWith(new Error('404 Not Found'));
    });
    test('update bill from an API and fails with 500 message error', async () => {
      const post = jest.spyOn(console, 'error');
      document.body.innerHTML = NewBillUI();
      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: jest.fn(() =>
            Promise.reject(new Error('500 Internal Server Error'))
          ),
        };
      });
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage,
      });
      const form = screen.getByTestId('form-new-bill');
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e));
      form.addEventListener('submit', handleSubmit);
      fireEvent.submit(form);
      await new Promise(process.nextTick);
      expect(post).toBeCalledWith(new Error('500 Internal Server Error'));
    });
  });
});
