import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Equal, ILike, In, LessThan, Repository } from "typeorm";
import { UserDetails } from "./entities/user.entity";

import { FeeDetails } from "./entities/fee.entities";
import { AddFeeDto } from "./dtos/createFee.dto";
import { UpdatePackageDto } from "./dtos/UpdatePackageDto.dto";
import { UpdateFeeDto } from "./dtos/updateFee.dto";
import { SuccessMessage } from "./entities/success-message.entities";
import { Category } from "./entities/categories.entity";
import { CreateBasicInfoDto } from "./dtos/basic-info.dto";
import {  Packages } from "./entities/packages.entity";
import { CreateIntendedLearnersDto } from "./dtos/create-intended-learners.dto";
import { IntendedLearners } from "./entities/intended-learners.entities";
import {  CreateCourseLandingPageDto } from "./dtos/course-landing-page-dto";
import { CourseLandingPage } from "./entities/course-landing-page.entities";
import * as fs from 'fs';
import * as path from 'path';
import { CartItem } from "./entities/cart_items.entity";
import { WishList } from "./entities/wish-list.entites";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PurchasedPackage } from "./entities/purchased-packages.entity";

@Injectable()
export class PackageService {
   private readonly logger = new Logger(PackageService.name);
  constructor(
    @InjectRepository(UserDetails)
    private userRepository: Repository<UserDetails>,
    
    @InjectRepository(FeeDetails)
    private feeRepository:Repository<FeeDetails>,


    @InjectRepository(SuccessMessage)
    private readonly successRepository: Repository<SuccessMessage>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Packages)
    private readonly packagesRepository: Repository<Packages>,
     @InjectRepository(IntendedLearners)
    private readonly intendedLearnersRepository: Repository<IntendedLearners>,

    @InjectRepository(CourseLandingPage)
    private readonly courseLandingPageRepository: Repository<CourseLandingPage>,

    @InjectRepository(CartItem)
    private readonly cartRepository: Repository<CartItem>,

    @InjectRepository(WishList)
    private readonly wishlistRepository: Repository<WishList>,

    @InjectRepository(PurchasedPackage)
    private readonly purchasedPackageRepository: Repository<PurchasedPackage>,
    

  
  
    
  ) {}
///delete discount details after the date

@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDiscountExpiry() {
    this.logger.log('Running discount expiry cleanup...');

    const expiredFees = await this.feeRepository
      .createQueryBuilder('fee')
      .where('fee.has_discount = true')
      .andWhere('fee.duration IS NOT NULL')
      .andWhere('fee.duration < CURRENT_DATE')
      .getMany();

    for (const fee of expiredFees) {
      fee.has_discount = false;
      fee.discount_value = null;
      fee.discount_type = null;
      fee.duration = null;

      await this.feeRepository.save(fee);
      this.logger.log(`Discount cleared for fee_id: ${fee.fee_id}`);
    }

    this.logger.log('Discount expiry cleanup completed.');
  }
  //delete incomplete packages older than 30 days

   @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCleanupCron() {
    console.log('Running scheduled cleanup for incomplete packages...');
    await this.deleteIncompletePackagesOlderThan30Days();
  }



  async createUser(userData: Partial<UserDetails>) {
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

 async getUserById(user_id: number): Promise<UserDetails | null> {
  return await this.userRepository.findOne({ where: { user_id } });
}


  async loginWithEmail(email: string): Promise<{ message: string; user?: UserDetails }> {
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      message: `Welcome back, ${user.name}`,
      user,
    };
  }

  async getAllUser():Promise<UserDetails[]>{
    return await this.userRepository.find();

  }

  async createCategory(categoryData: { categoryName: string }): Promise<Category> {
    const category = this.categoryRepository.create(categoryData);
    return this.categoryRepository.save(category);
  }

 async createBasicInfo(createBasicInfoDto: CreateBasicInfoDto): Promise<Packages> {
  const { title, categoryId, userId } = createBasicInfoDto;

  // Step 1: Fetch the UserDetails entity
  const user = await this.userRepository.findOne({ where: { user_id: userId } });
  if (!user) {
    throw new NotFoundException(`User with ID ${userId} not found`);
  }

  // Step 2: Fetch the Category entity
  const category = await this.categoryRepository.findOne({ where: { cat_id: categoryId } });
  if (!category) {
    throw new NotFoundException(`Category with ID ${categoryId} not found`);
  }

  // Step 3: Create and assign relations
  const basicInfoEntity = this.packagesRepository.create({
    title,
    user,       // Assign full user entity
    category,   // Assign full category entity
  });

  // Step 4: Save the package
  return await this.packagesRepository.save(basicInfoEntity);
}


 async deleteIncompletePackagesOlderThan30Days(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    await this.packagesRepository.delete({
      complete_status: 'incomplete',
      updated_at: LessThan(thirtyDaysAgo),
    });
  }


async getPackagesByUserId(userId: number): Promise<{ success: boolean; message: string; data?: Packages[] }> {
  // Step 1: Check if user exists
  const userExists = await this.userRepository.findOne({ where: { user_id: userId } });

  if (!userExists) {
    return {
      success: false,
      message: `User with ID ${userId} does not exist`,
    };
  }

  // Step 2: Fetch related packages using relation
  const packages = await this.packagesRepository.find({
    where: {
      user: {
        user_id: userId,
      },
    },
    relations: [
      'category',
      'user',               // 👈 Include this to return full user details
      'courseLandingPage',
      'feeDetails',
      'intendedLearners',
      'successMessage',
    ],
    order: {
      created_at: 'DESC',
    },
  });

  if (!packages || packages.length === 0) {
    return {
      success: false,
      message: `No packages found for user with ID ${userId}`,
    };
  }

  return {
    success: true,
    message: 'Packages fetched successfully',
    data: packages,
  };
}




async deletePackage(packageId: number): Promise<void> {
  // Find the related CourseLandingPage (with file info)
  const courseLandingPage = await this.courseLandingPageRepository.findOne({
    where: { packages: { package_id: packageId } },
  });

  // Helper to delete a file if it exists
  const deleteFile = (fileUrl: string | null | undefined) => {
    if (!fileUrl) return;
    // If fileUrl is a full URL, remove the domain part
    const filePath = fileUrl.replace(/^https?:\/\/[^\/]+/, '').replace(/^\//, '');
    const absolutePath = path.join(process.cwd(), filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  };

  // Delete files before DB cascade
  if (courseLandingPage) {
    deleteFile(courseLandingPage.coverImage);
    deleteFile(courseLandingPage.thumbnailImage);
    deleteFile(courseLandingPage.videoFile);
  }

  // Delete the package (cascade will remove CourseLandingPage from DB)
  const result = await this.packagesRepository.delete({ package_id: packageId });

  if (result.affected === 0) {
    throw new NotFoundException(`BasicInfo with package ID ${packageId} not found`);
  }
}

async publishPackage(packageId: number): Promise<Packages> {
  const basicInfo = await this.packagesRepository.findOne({
    where: { package_id: packageId },
  });

  if (!basicInfo) {
    throw new NotFoundException(`Package with ID ${packageId} not found`);
  }

  // Check if complete_status is not 'complete'
  if (basicInfo.complete_status !== 'complete') {
    throw new BadRequestException('Cannot publish package. Package is incomplete.');
  }

  basicInfo.status = 'published';
  return await this.packagesRepository.save(basicInfo);
}


// In package.service.ts
async updateCompleteStatus(packageId: number): Promise<{ message: string; packages: Packages }> {
    const packageToUpdate = await this.packagesRepository.findOne({
      where: { package_id: packageId },
    });

    if (!packageToUpdate) {
      throw new Error('Package not found');
    }

    packageToUpdate.complete_status = 'complete';

    const updatedPackage = await this.packagesRepository.save(packageToUpdate);

    return {
      message: 'Complete status updated successfully',
      packages: updatedPackage,
    };
  }



async getPackageByPackageId(packageId: number) {
  const packageData = await this.packagesRepository.findOne({
    where: { package_id: packageId },
    relations: [
      'category',
      'user',
      'courseLandingPage',
      'feeDetails',
      'intendedLearners',
      'successMessage',
    ],
  });

  if (!packageData) {
    throw new NotFoundException(`Package with ID ${packageId} not found`);
  }

  return packageData;
}


async findAllPackages(): Promise<Packages[]> {
  return this.packagesRepository.find({
    relations: ['user', 'category', 'courseLandingPage', 'feeDetails'], // include relations if needed
    order: { created_at: 'DESC' },
  });
}

async findByCategoryId(categoryId: number): Promise<Packages[]> {
    return this.packagesRepository.find({
      where: { category: {cat_id: categoryId } },  // Filter by categoryId
      relations: ['category', 'user', 'feeDetails','courseLandingPage','intendedLearners'], // eager relations you want to load
    });
  }



  async createIntendedLearners(packageId: string, createIntendedLearnersDto: CreateIntendedLearnersDto) {
  const numericPackageId = parseInt(packageId, 10); // Convert string to number

  if (isNaN(numericPackageId)) {
    throw new Error('Invalid packageId');
  }

  const basicInfoEntity = await this.packagesRepository.findOne({
    where: { package_id: numericPackageId },
  });

  if (!basicInfoEntity) {
    throw new NotFoundException(`Packages with package_id ${packageId} not found`);
  }

  const intendedLearners = this.intendedLearnersRepository.create({
    ...createIntendedLearnersDto,
    packages: basicInfoEntity,
  });

  return await this.intendedLearnersRepository.save(intendedLearners);
}

// package.service.ts

async getIntendedLearnersByPackageId(packageId: number) {
  const basicInfo = await this.packagesRepository.findOne({
    where: { package_id: Number(packageId) },
  });

  if (!basicInfo) {
    throw new NotFoundException('Package not found');
  }

  const intendedLearners = await this.intendedLearnersRepository.findOne({
    where: { packages: { package_id: basicInfo.package_id } },
  });

  if (!intendedLearners) {
    throw new NotFoundException('Intended learners data not found');
  }

  return intendedLearners;
}

 // intended-learners.service.ts
async updateByPackageId(packageId: string, body: any) {
  const intended = await this.intendedLearnersRepository.findOne({
    where: {
      packages: Equal(packageId), // clean and type-safe
    },
    relations: ['packages'],
  });

  if (!intended) {
    throw new NotFoundException(`Intended Learner not found for package ID ${packageId}`);
  }

  intended.learningObjectives = body.learningObjectives;
  intended.requirements = body.requirements;
  intended.audience = body.audience;

  return await this.intendedLearnersRepository.save(intended);
}

async createCourseLandingPage(
  createDto: CreateCourseLandingPageDto,
  files: {
    coverImage?: Express.Multer.File[];
    thumbnailImage?: Express.Multer.File[];
    videoFile?: Express.Multer.File[];
  },
  packageId: number,
): Promise<CourseLandingPage> {
  const packages = await this.packagesRepository.findOne({ where: { package_id: packageId } });

  if (!packages) {
    throw new Error('BasicInfo with the given packageId does not exist.');
  }

  // Convert "null" string or empty string to actual null
  if (typeof createDto.seats === "string" && (createDto.seats === "null" || createDto.seats === "")) {
    createDto.seats = null;
  }

  const baseUrl = 'http://localhost:3000';
  const normalizePath = (path: string | undefined | null): string | null =>
    path ? '/' + path.replace(/\\/g, '/') : null;
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  const coverImageUrl = normalizePath(files.coverImage?.[0]?.path)
    ? `${normalizedBaseUrl}${normalizePath(files.coverImage?.[0]?.path)}`
    : null;
  const thumbnailImageUrl = normalizePath(files.thumbnailImage?.[0]?.path)
    ? `${normalizedBaseUrl}${normalizePath(files.thumbnailImage?.[0]?.path)}`
    : null;
  const videoFileUrl = normalizePath(files.videoFile?.[0]?.path)
    ? `${normalizedBaseUrl}${normalizePath(files.videoFile?.[0]?.path)}`
    : null;

  // --- Update the package title and category here ---
  if (createDto.title) {
    packages.title = createDto.title;
  }
  if (createDto.categoryId) {
    // Fetch the category entity
    const category = await this.categoryRepository.findOne({ where: { cat_id: createDto.categoryId } });
    if (category) {
      packages.category = category;
    }
  }
  await this.packagesRepository.save(packages);
  // --- End update ---

  const courseLandingPage = this.courseLandingPageRepository.create({
    ...createDto,
    coverImage: coverImageUrl,
    thumbnailImage: thumbnailImageUrl,
    videoFile: videoFileUrl,
    seats: createDto.seats,
    packages,
  });

  return this.courseLandingPageRepository.save(courseLandingPage);
}


   async getCourseLandingPageByPackageId(packageId: number) {
  const packages = await this.packagesRepository.findOne({
    where: { package_id: Number(packageId) },
  });

  if (!packages) {
    throw new NotFoundException('BasicInfo (Package) not found');
  }

  const courseLandingPage = await this.courseLandingPageRepository.findOne({
    where: { packages: { package_id: packages.package_id } },
  });

  if (!courseLandingPage) {
    throw new NotFoundException('Intended learners data not found');
  }

  return courseLandingPage;
}

async updateCourseLandingPage(
  packageId: number,
  updateDto: CreateCourseLandingPageDto,
  files: {
    coverImage?: Express.Multer.File[];
    thumbnailImage?: Express.Multer.File[];
    videoFile?: Express.Multer.File[];
  },
): Promise<CourseLandingPage> {
  const packages = await this.packagesRepository.findOne({
    where: { package_id: packageId },
  });

  if (!packages) {
    throw new Error('BasicInfo with the given packageId does not exist.');
  }

  const existingLandingPage = await this.courseLandingPageRepository.findOne({
    where: { packages: { package_id: packages.package_id } },
    relations: ['packages'],
  });

  if (!existingLandingPage) {
    throw new Error('Course landing page not found for the given package.');
  }

  // --- Update the package title and category here ---
  if (updateDto.title) {
    packages.title = updateDto.title;
  }
  if (updateDto.categoryId) {
    const category = await this.categoryRepository.findOne({ where: { cat_id: updateDto.categoryId } });
    if (category) {
      packages.category = category;
    }
  }
  await this.packagesRepository.save(packages);
  // --- End update ---

  // Normalize seats value
  if (typeof updateDto.seats === "string" && (updateDto.seats === "null" || updateDto.seats === "")) {
    updateDto.seats = null;
  }

  const baseUrl = 'http://localhost:3000';
  const normalizePath = (path: string | undefined | null): string | null =>
    path ? '/' + path.replace(/\\/g, '/') : null;
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  // Helper to delete old file
  const deleteFile = (fileUrl: string | null | undefined) => {
    if (!fileUrl) return;
    const filePath = fileUrl.replace(/^https?:\/\/[^\/]+/, '').replace(/^\//, '');
    const absolutePath = path.join(process.cwd(), filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  };

  let coverImageUrl = existingLandingPage.coverImage;
  if (files.coverImage?.[0]?.path) {
    deleteFile(existingLandingPage.coverImage);
    coverImageUrl = `${normalizedBaseUrl}${normalizePath(files.coverImage[0].path)}`;
  }

  let thumbnailImageUrl = existingLandingPage.thumbnailImage;
  if (files.thumbnailImage?.[0]?.path) {
    deleteFile(existingLandingPage.thumbnailImage);
    thumbnailImageUrl = `${normalizedBaseUrl}${normalizePath(files.thumbnailImage[0].path)}`;
  }

  let videoFileUrl = existingLandingPage.videoFile;
  if (files.videoFile?.[0]?.path) {
    deleteFile(existingLandingPage.videoFile);
    videoFileUrl = `${normalizedBaseUrl}${normalizePath(files.videoFile[0].path)}`;
  }

  const updatedLandingPage = this.courseLandingPageRepository.merge(
    existingLandingPage,
    {
      ...updateDto,
      coverImage: coverImageUrl,
      thumbnailImage: thumbnailImageUrl,
      videoFile: videoFileUrl,
      seats: updateDto.seats,
    },
  );

  return this.courseLandingPageRepository.save(updatedLandingPage);
}

async addFee(fee: Partial<FeeDetails>) {
  const {
    total_fee,
    discount_value,
    packages: pkg,
    first_payment,
    recurring_amount,
    number_of_months,
    min_amount,
    ...rest
  } = fee;

  const safeNumber = (value: any): number | null => {
    return value === '' || value === undefined || value === null
      ? null
      : Number(value);
  };

  if (total_fee === undefined || total_fee === null || isNaN(Number(total_fee))) {
    throw new BadRequestException('Total fee is required and must be a valid number');
  }

  if (!pkg || !pkg.package_id) {
    throw new BadRequestException('Package ID is required');
  }

  const existingPackage = await this.packagesRepository.findOne({
    where: { package_id: pkg.package_id },
  });

  if (!existingPackage) {
    throw new NotFoundException(`Package with ID ${pkg.package_id} not found`);
  }

  const existingFee = await this.feeRepository.findOne({
    where: { packages: { package_id: pkg.package_id } },
  });

  if (existingFee) {
    throw new ConflictException(`Fee details for package ID ${pkg.package_id} already exist`);
  }

  const feeDetails = this.feeRepository.create({
    ...(rest as any),
    total_fee: Number(total_fee),
    first_payment: safeNumber(first_payment),
    discount_value: safeNumber(discount_value),
    recurring_amount: safeNumber(recurring_amount),
    number_of_months: safeNumber(number_of_months),
    min_amount: safeNumber(min_amount),
    packages: existingPackage,
  } as DeepPartial<FeeDetails>);

  const savedFee = await this.feeRepository.save(feeDetails);

  // ✅ Update is_free field in basic_info table based on total_fee
  existingPackage.is_free = Number(total_fee) === 0; // true if 0, false otherwise
  await this.packagesRepository.save(existingPackage);

  return savedFee;
}




async deleteFeeByPackageId(package_id: number): Promise<{ message: string }> {
  const feeDetails = await this.feeRepository.findOne({
    where: {packages: { package_id } }, // assuming relation field is `package`
  });

  if (!feeDetails) {
    throw new NotFoundException(`Fee details for package ID ${package_id} not found`);
  }

  const pkg = await this.packagesRepository.findOne({
    where: { package_id },
  });

  if (!pkg) {
    throw new NotFoundException(`Package with ID ${package_id} not found`);
  }

  // Delete the fee details
  await this.feeRepository.remove(feeDetails);

  // Set package as free
  pkg.is_free = true;
  await this.packagesRepository.save(pkg);

  return { message: `Fee details deleted and package ${package_id} set to free.` };
}

async deleteContent(id: string): Promise<{ message: string }> {
    const content = await this.successRepository.findOne({
      where: { packages: { package_id: Number(id) } }, // Find the content using the relation
    });

    if (!content) {
      throw new NotFoundException(`Success message for package ID ${id} not found.`);
    }

    // Delete the success message
    await this.successRepository.remove(content);

    return { message: `Success message for package ID ${id} deleted successfully.` };
  }


 async addToCart(userId: number, packageId: number): Promise<CartItem> {
    const user = await this.userRepository.findOne({ where: { user_id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const pkg = await this.packagesRepository.findOne({ where: { package_id: packageId } });
    if (!pkg) throw new NotFoundException('Package not found');

    const alreadyInCart = await this.cartRepository.findOne({
      where: { user: { user_id: userId }, packages: { package_id: packageId } },
    });

    if (alreadyInCart) throw new ConflictException('Item already in cart');

    const cartItem = this.cartRepository.create({
      user,
      packages: pkg,
    });

    return this.cartRepository.save(cartItem);
  }

async getCartItemsByUserId(userId: number): Promise<CartItem[]> {
  return this.cartRepository.find({
    where: { user: { user_id: userId } },
    relations: ['packages','packages.courseLandingPage','packages.feeDetails'],
  });
}

async removeFromCart(userId: number, packageId: number): Promise<void> {
  const cartItem = await this.cartRepository.findOne({
    where: { user: { user_id: userId }, packages: { package_id: packageId } },
  });

  if (!cartItem) {
    throw new NotFoundException('Cart item not found');
  }

  await this.cartRepository.remove(cartItem);
}


async addToWishlist(userId: number, packageId: number): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { user_id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const pkg = await this.packagesRepository.findOne({ where: { package_id: packageId } });
    if (!pkg) throw new NotFoundException(`Package with ID ${packageId} not found`);

    const existing = await this.wishlistRepository.findOne({ where: { user: { user_id: userId }, packages: { package_id: packageId } } });
    if (existing) throw new ConflictException('Item already in wishlist');

    const wishlistItem = this.wishlistRepository.create({ user, packages: pkg });
    await this.wishlistRepository.save(wishlistItem);

    return { message: 'Added to wishlist' };
  }


  // wishlist.service.ts
async getWishlistByUserId(userId: number) {
  const wishlistItems = await this.wishlistRepository.find({
    where: { user: { user_id: userId } },
     relations: ['packages','packages.courseLandingPage','packages.feeDetails'],
    order: { added_on: 'DESC' },
  });

  return wishlistItems;
}

async removeFromWishlist(userId: number, packageId: number): Promise<{ message: string }> {
  const wishlistItem = await this.wishlistRepository.findOne({
    where: {
      user: { user_id: userId },
      packages: { package_id: packageId },
    },
    relations: ['user', 'packages'],
  });

  if (!wishlistItem) {
    throw new NotFoundException('Wishlist item not found');
  }

  await this.wishlistRepository.remove(wishlistItem);

  return { message: 'Removed from wishlist' };
}


async isWishlisted(userId: number, packageId: number): Promise<boolean> {
    const entry = await this.wishlistRepository.findOne({
      where: {
      user: { user_id: userId },
      packages: { package_id: packageId },
    },
    relations: ['user', 'packages'],
    });
    return !!entry;
  }
async checkWishlistAndCart(userId: number, packageId: number): Promise<{ isWishlisted: boolean; isInCart: boolean }> {
    const [wish, cart] = await Promise.all([
      this.wishlistRepository.findOne({
        where: { user: { user_id: userId }, packages: { package_id: packageId } },
      }),
      this.cartRepository.findOne({
        where: { user: { user_id: userId }, packages: { package_id: packageId } },
      }),
    ]);

    return {
      isWishlisted: !!wish,
      isInCart: !!cart,
    };
  }

  async createPurchase(userId: number, packageId: number): Promise<PurchasedPackage> {
    const user = await this.userRepository.findOneBy({ user_id: userId });
    const pkg = await this.packagesRepository.findOneBy({ package_id: packageId });

    if (!user) throw new Error('User not found');
    if (!pkg) throw new Error('Package not found');

    const purchase = this.purchasedPackageRepository.create({
      user,
      packages: pkg,
      purchaseDate: new Date(),
    });

    return await this.purchasedPackageRepository.save(purchase);
  }

  // package.service.ts
async isPackagePurchased(userId: number, packageId: number): Promise<boolean> {
  const purchase = await this.purchasedPackageRepository.findOne({
    where: {
      user: { user_id: userId },
      packages: { package_id: packageId },
    },
  });

  return !!purchase;
}

async getAllPurchasedByUser(userId: number) {
    return this.purchasedPackageRepository.find({
      where: { user: { user_id: userId } },
       relations: ['packages','packages.courseLandingPage','packages.feeDetails'],
      order: { purchaseDate: 'DESC' }
    });
  }

  async countByPackage(packageId: number): Promise<number> {
  const count = await this.purchasedPackageRepository.count({
    where: {
      packages: { package_id: packageId },  // double-check this below
    },
    relations: ['packages'],  // optional depending on your setup
  });

  return count;  // <== return the count here
}

// packages.service.ts
async searchPackageByTitle(query: string): Promise<any[]> {
  return this.packagesRepository
    .createQueryBuilder('packages')
    .leftJoinAndSelect('packages.courseLandingPage', 'clp')
    .where('LOWER(clp.title) LIKE LOWER(:query)', { query: `%${query}%` })
    .select([
      'packages.package_id',
      'packages.is_free',
      'clp.title',
      'clp.coverImage', // if needed for UI display
    ])
    .limit(10)
    .getMany();
}


async getFee():Promise<FeeDetails[]>{
  return await this.feeRepository.find({
    relations:['package'],
  });
}

async getFeewithPackage():Promise<FeeDetails[]>{
  return await this.feeRepository
  .createQueryBuilder('fee')
  .leftJoinAndSelect('fee.package', 'package')
  .select([
    'fee', // Select all fee details
    'package.package_id', // Only select package_id
    'package.name' // Only select package name
  ])
  .getMany();

}

async getFeeDetailsByPackageId(packageId: string): Promise<any> {
  // Check if the package exists
  const packages = await this.packagesRepository.findOne({
    where: { package_id: Number(packageId) },
  });

  if (!packages) {
    throw new NotFoundException(`Package with ID ${packageId} not found`);
  }

  if (packages.is_free) {
    return {
      isFree: true,
      message: 'This package is free',
    };
  }

  // If not free, fetch FeeDetails
  const feeDetails = await this.feeRepository.findOne({
  where: { packages: { package_id: Number(packageId) } },
  relations: ['packages'],
});


  if (!feeDetails) {
    throw new NotFoundException(`No fee details found for package ID ${packageId}`);
  }

  return {
    isFree: false,
    ...feeDetails,
  };
}

async updateFeeDetails(updateData: Partial<FeeDetails>): Promise<FeeDetails> {
  console.log(updateData)
  const packageId = updateData.packages?.package_id;

  const packageEntity = await this.packagesRepository.findOne({
    where: { package_id: Number(packageId) },
  });

  if (!packageEntity) {
    throw new NotFoundException(`Package with ID ${packageId} not found`);
  }

  const existingFee = await this.feeRepository.findOne({
    where: { packages: { package_id: Number(packageId) } },
    relations: ['packages'],
  });

  if (!existingFee) {
    throw new NotFoundException(`Fee details for package ID ${packageId} not found`);
  }

  // Safe number helper
  const safeNumber = (val: any) =>
    val === '' || val === null || val === undefined ? null : Number(val);

  // Update fields
  existingFee.total_fee = safeNumber(updateData.total_fee);
  existingFee.discount_value = safeNumber(updateData.discount_value);
  existingFee.discount_type = updateData.discount_type || null;
  existingFee.has_discount = updateData.has_discount ?? false;
  existingFee.is_recurring = updateData.is_recurring ?? false;
  existingFee.recurring_amount = safeNumber(updateData.recurring_amount);
  existingFee.first_payment = safeNumber(updateData.first_payment);
  existingFee.number_of_months = safeNumber(updateData.number_of_months);
  existingFee.allow_min_amount = updateData.allow_min_amount ?? false;
  existingFee.min_amount = safeNumber(updateData.min_amount);
  existingFee.payment_methods = updateData.payment_methods || '';
  
  existingFee.duration=updateData.duration || null;

  // Update is_free in package table
  packageEntity.is_free = Number(updateData.total_fee) === 0;
  await this.packagesRepository.save(packageEntity);

  return await this.feeRepository.save(existingFee);
}

async createContent(packageId: number, pageContent: string): Promise<{ message: string }> {
  const existingContent = await this.successRepository.findOne({
    where: { packages: { package_id: packageId } },
  });

  if (existingContent) {
    return { message: 'Content already exists for this package. Consider updating instead.' };
  }

  const packages = await this.packagesRepository.findOne({
    where: { package_id: packageId },
  });

  if (!packages) {
    throw new NotFoundException('Package not found');
  }

  const newContent = this.successRepository.create({
    packages,
    pageContent,
  });

  await this.successRepository.save(newContent);

  return { message: 'Success message created successfully.' };
}


async findContent(packageId: number): Promise<SuccessMessage | null> {
  const content = await this.successRepository.findOne({
    where: { packages: { package_id: packageId } },
    relations: ['packages'],
  });

  return content || null;
}


async updateContent(packageId: string, pageContent: string): Promise<{ message: string }> {
  const existingContent = await this.successRepository.findOne({
    where: { packages: { package_id: Number(packageId) } },
  });

  if (!existingContent) {
    throw new NotFoundException('Success message not found for this package.');
  }

  // Update the page content with the new HTML content
  existingContent.pageContent = pageContent;

  // Save the updated content
  await this.successRepository.save(existingContent);

  // Return a JSON response with a message
  return { message: 'Content successfully updated' };
}



 
  
  
  
}


