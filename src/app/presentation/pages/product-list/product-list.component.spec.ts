import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductListComponent } from './product-list.component';
import { GetProducts } from '../../../core/use-cases/get-product-usecase/get-products.usecase';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { Product, ProductResponse, SuccessResponse } from '../../../core/domain/product.model';
import { ShareDataService } from '../../../data/services/share-data.service';
import { DropdownComponent } from '../../components/dropdown/dropdown.component';
import { CommonModule } from '@angular/common';
import { DeleteProduct } from '../../../core/use-cases/delete-product-usecase/delete-product.usecase';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let deleteProductUseCase: DeleteProduct;
  let router: Router;
  let dataService: ShareDataService<Product | undefined>;

  beforeEach(async () => {
    const mockProductResponse: ProductResponse = {
      data: [
        { id: '1', name: 'Test Product 1', description: 'Test Description 1' }, // Objeto literal
        { id: '2', name: 'Test Product 2', description: 'Test Description 2' }, // Objeto literal
      ] as Product[] // Castea a Product[]
    };

    const getProductsMock = {
      execute: () => of(mockProductResponse)
    };

    const deleteProductMock = {
      execute: () => of({ success: true, message: 'Product deleted' } as SuccessResponse)
    };

    const routerMock = {
      navigate: () => Promise.resolve()
    };

    const dataServiceMock = {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      sharedData: () => {}
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CommonModule, ProductListComponent, DropdownComponent], // Importa ReactiveFormsModule, CommonModule y declara DropdownComponent
      declarations: [],
      providers: [
        { provide: GetProducts, useValue: getProductsMock },
        { provide: DeleteProduct, useValue: deleteProductMock },
        { provide: Router, useValue: routerMock },
        { provide: ShareDataService, useValue: dataServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    deleteProductUseCase = TestBed.inject(DeleteProduct);
    router = TestBed.inject(Router);
    dataService = TestBed.inject(ShareDataService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    expect(component.products.length).toBe(2);
    expect(component.filteredProducts.length).toBe(2); // Verifica que filteredProducts también se inicializa
  });

  it('should filter products', () => {
    component.searchTerm.setValue('1');
    expect(component.filteredProducts.length).toBe(1);

    component.searchTerm.setValue(''); // Limpia la búsqueda
    expect(component.filteredProducts.length).toBe(2); // Debe volver a mostrar todos los productos
  });

  it('should edit a product', () => {
    const productId = '1';
    spyOn(router, 'navigate');
    spyOn(dataService, 'sharedData');

    component.editProduct(productId);

    expect(dataService.sharedData).toHaveBeenCalledWith(component.products.find(p => p.id === productId));
    expect(router.navigate).toHaveBeenCalledWith([`/products/edit/${productId}`]);
  });


  it('should delete a product', fakeAsync(() => {
    const productId = '1';
    spyOn(deleteProductUseCase, 'execute').and.callThrough();

    component.deleteProduct(productId);
    tick(2000); // Espera 2 segundos (2000 milisegundos) para que desaparezca el mensaje
    fixture.detectChanges(); // Forzar la detección de cambios para que se actualice la vista

    expect(deleteProductUseCase.execute).toHaveBeenCalledWith(productId);
    expect(component.filteredProducts.length).toBe(1); // Un producto menos después del borrado
    expect(component.messageResponse).toBe(''); // El mensaje debe estar vacío después de 2 segundos
  }));

    it('should handle delete product error', () => {
      const productId = '1';
      const errorMessage = 'Error deleting product';
      spyOn(deleteProductUseCase, 'execute').and.returnValue(throwError(() => errorMessage));
      spyOn(window, 'alert'); // Espía el alert de window

      component.deleteProduct(productId);

      expect(window.alert).toHaveBeenCalledWith('Error al eliminar el producto: ' + errorMessage);
    });

  it('should navigate to add product', () => {
    spyOn(router, 'navigate');

    component.goToAddProduct();

    expect(router.navigate).toHaveBeenCalledWith(['/products/add']);
  });

  it('should generate pagination', () => {
    component.itemsPerPage.setValue(1);
    component.generatePagination();
    expect(component.filteredProducts.length).toBe(1);

    component.itemsPerPage.setValue(5); // Restablece el valor
    component.generatePagination();
    expect(component.filteredProducts.length).toBe(2); // Debe mostrar todos los productos
  });
});