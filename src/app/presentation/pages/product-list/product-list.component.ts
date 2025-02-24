import { Component, OnInit } from '@angular/core'; 
import { Product, SuccessResponse } from '../../../core/domain/product.model';
import { GetProducts } from '../../../core/use-cases/get-product-usecase/get-products.usecase';
import { Router } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProductMapper } from '../../../core/domain/product-mapper';
import { DropdownComponent } from '../../components/dropdown/dropdown.component';
import { ShareDataService } from '../../../data/services/share-data.service';
import { DeleteProduct } from '../../../core/use-cases/delete-product-usecase/delete-product.usecase';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule, DropdownComponent],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  product: Product | undefined;
  searchTerm = new FormControl('');
  filteredProducts: Product[] = [];
  itemsPerPage = new FormControl(5);
  messageResponse = '';
  pageOptions: string[] = ['5', '10', '20'];
  dropdownOptions = [
    { label: 'Editar', action: (id: string) => this.editProduct(id) },
    { label: 'Eliminar', action: (id: string) => this.deleteProduct(id) }
  ];

  constructor(private getProducts: GetProducts,
     private deleteProductUseCase: DeleteProduct,
     private datosService: ShareDataService<Product | undefined>,
     private router: Router) {}

  ngOnInit(): void {
    this.loadProducts();

    this.searchTerm.valueChanges.subscribe((searchText) => {
      this.filterProducts(searchText!);
    });

    this.itemsPerPage.valueChanges.subscribe(() => {
      this.generatePagination();
    });
  }
  
  private loadProducts(): void {
    this.getProducts.execute().subscribe({
      next: (respuesta) => {
        this.products = respuesta.data.map(ProductMapper.toViewModel);
        this.generatePagination();
      },
      error: (err) => {
        alert('Error al obtener los productos: ' + err);
      }
    });
  }

  filterProducts(searchText: string) {
    if (!searchText) {
      this.generatePagination();
      return;
    }

    this.filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(searchText.toLowerCase()) ||
      product.description.toLowerCase().includes(searchText.toLowerCase())
    );
  }

  editProduct(id: string) {
    this.product = this.products.find(product => product.id === id);
    this.datosService.sharedData(this.product);
    this.router.navigate([`/products/edit/${id}`]);
  }
  
  deleteProduct(id: string) {
    this.deleteProductUseCase.execute(id).subscribe({
      next: (respuesta: SuccessResponse) => {
        this.filteredProducts = this.filteredProducts.filter(product => product.id !== id);
        this.messageResponse = respuesta.message;
        setTimeout(() => {
          this.messageResponse = '';
        }, 2000);
      },
      error: (err) => {
        alert('Error al eliminar el producto: ' + err);
      } 
    });
  }
  
  generatePagination() {
    const limit = this.itemsPerPage.value || 5;
    this.filteredProducts = this.products.slice(0, limit);
  }

  goToAddProduct() {
    this.router.navigate(['/products/add']);
  }
}
