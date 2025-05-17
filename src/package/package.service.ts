import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, Equal, In, Repository } from "typeorm";
import { UserDetails } from "./entities/user.entity";
import { Package } from "./entities/package.entity";
import { FeeDetails } from "./entities/fee.entities";
import { Promotion } from "./entities/promotion.entities";
import { PackageAccess } from "./entities/package-acess.entities";
import { Community } from "./entities/community.entities";
import { Assessment } from "./entities/assessment.entities";
import { Course } from "./entities/course.entity";
import { ModulePackage, ModuleType } from "./entities/module_package.entity";
import Module from "module";
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

@Injectable()
export class PackageService {
  constructor(
    @InjectRepository(UserDetails)
    private userRepository: Repository<UserDetails>,

    @InjectRepository(Package)
    private packageRepository: Repository<Package> ,
    
    @InjectRepository(FeeDetails)
    private feeRepository:Repository<FeeDetails>,

    @InjectRepository(Promotion)
    private promoRepository:Repository<Promotion>,

    @InjectRepository(PackageAccess)
    private accessRepository:Repository<PackageAccess>,

    @InjectRepository(Community)
    private communityRepository:Repository<Community>,

    @InjectRepository(Assessment)
    private assessmentRepository:Repository<Assessment>,

    @InjectRepository(ModulePackage)
    private moduleRepository:Repository<ModulePackage>,

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
    

  
  
    
  ) {}

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
  packageId: number, // Accept the packageId as a parameter
): Promise<CourseLandingPage> {
  // Retrieve the BasicInfo using the packageId
 const packages = await this.packagesRepository.findOne({ where: { package_id: packageId } });


  if (!packages) {
    throw new Error('BasicInfo with the given packageId does not exist.');
  }
 const baseUrl = 'http://localhost:3000';
  // Helper function to normalize file paths
  // Normalize the file path (replaces backslashes and handles undefined/null)
const normalizePath = (path: string | undefined | null): string | null => 
    path ? '/' + path.replace(/\\/g, '/') : null;

// Base URL (ensure it does not end with a slash)
const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

// Handle file uploads and normalize paths with base URL
const coverImageUrl = normalizePath(files.coverImage?.[0]?.path) ? `${normalizedBaseUrl}${normalizePath(files.coverImage?.[0]?.path)}` : null;
const thumbnailImageUrl = normalizePath(files.thumbnailImage?.[0]?.path) ? `${normalizedBaseUrl}${normalizePath(files.thumbnailImage?.[0]?.path)}` : null;
const videoFileUrl = normalizePath(files.videoFile?.[0]?.path) ? `${normalizedBaseUrl}${normalizePath(files.videoFile?.[0]?.path)}` : null;


  // Create the CourseLandingPage and associate with BasicInfo
 const courseLandingPage = this.courseLandingPageRepository.create({
  ...createDto,
  coverImage: coverImageUrl,
  thumbnailImage: thumbnailImageUrl,
  videoFile: videoFileUrl,
  packages, // ✅ Correct property to establish the relation
});


  // Save to the database
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
  // Retrieve the BasicInfo using the packageId
  const packages = await this.packagesRepository.findOne({
    where: { package_id: packageId },
  });

  if (!packages) {
    throw new Error('BasicInfo with the given packageId does not exist.');
  }

  // Retrieve existing landing page using BasicInfo
  const existingLandingPage = await this.courseLandingPageRepository.findOne({
    where: { packages: { package_id: packages.package_id } },
    relations: ['packages'],
  });

  if (!existingLandingPage) {
    throw new Error('Course landing page not found for the given package.');
  }

  const baseUrl = 'http://localhost:3000';

  // Helper function to normalize file paths
  const normalizePath = (path: string | undefined | null): string | null => 
    path ? '/' + path.replace(/\\/g, '/') : null;

  const normalizedBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash if present

  

  // Process new files if uploaded, otherwise keep existing
  const coverImageUrl = files.coverImage?.[0]?.path
    ? `${normalizedBaseUrl}${normalizePath(files.coverImage[0].path)}`
    : existingLandingPage.coverImage;

  const thumbnailImageUrl = files.thumbnailImage?.[0]?.path
    ? `${normalizedBaseUrl}${normalizePath(files.thumbnailImage[0].path)}`
    : existingLandingPage.thumbnailImage;

  const videoFileUrl = files.videoFile?.[0]?.path
    ? `${normalizedBaseUrl}${normalizePath(files.videoFile[0].path)}`
    : existingLandingPage.videoFile;

  // Log the final URLs to check if they are correctly assigned
  console.log('Updated URLs:', {
    coverImageUrl,
    thumbnailImageUrl,
    videoFileUrl,
  });

  // Merge and update the entity
  const updatedLandingPage = this.courseLandingPageRepository.merge(
    existingLandingPage,
    {
      ...updateDto,
      coverImage: coverImageUrl,
      thumbnailImage: thumbnailImageUrl,
      videoFile: videoFileUrl,
    },
  );

  // Save updated landing page to the database
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















  /////////////////////////////////////////////////////////////////////////////////////
/* remove this only
  async createPackage(packageData: Partial<Package> & { instructor_id?: number }, file?: Express.Multer.File) {
    // Validate required fields
    if (!packageData.name) {
        throw new BadRequestException("Package name is required.");
    }
    if (!packageData.instructor_id) {
        throw new BadRequestException("Instructor ID is required.");
    }
    
    // Convert instructor_id to a number
    const instructorId = Number(packageData.instructor_id);
    if (isNaN(instructorId)) {
        throw new BadRequestException("Instructor ID must be a valid number.");
    }

    // Fetch instructor from `UserDetails`
    const instructor = await this.userRepository.findOne({
      where: {
          user_id: instructorId,
          role: 'instructor',
      },
  });
  
  if (!instructor) {
      throw new NotFoundException(`Instructor with ID ${instructorId} not found.`);
  }

    // Store file URL if uploaded
    if (file) {
        packageData.cover_image = `http://localhost:3000/uploads/${file.filename}`;
    }

    if (typeof packageData.description === 'string' && packageData.description.startsWith('[')) {
      try {
        const parsed = JSON.parse(packageData.description);
        if (Array.isArray(parsed)) {
          packageData.description = parsed.join('');
        }
      } catch (e) {
        console.warn('Description is not a JSON array:', e);
      }
    }
    
    
    // Create package entity and associate instructor
    const { instructor_id, ...packageDetails } = packageData; // No error now
    const newPackage = this.packageRepository.create({
        ...packageDetails,
        instructor, 
        is_published:false,
    });
console.log(newPackage)
    // Save the package
    return await this.packageRepository.save(newPackage);
}


async updatePackageMedia(
  packageId: number,
  mediaData: {
    cover_image?: string;
    thumbnailUrl?: string;
    promoVideoUrl?: string;
  },
) {
  const packageToUpdate = await this.packageRepository.findOne({
    where: { package_id: packageId },
  });

  if (!packageToUpdate) {
    throw new NotFoundException(`Package with ID ${packageId} not found`);
  }

  // Only update fields if they are provided
  if (mediaData.cover_image !== undefined) {
    packageToUpdate.cover_image = mediaData.cover_image;
  }

  if (mediaData.thumbnailUrl !== undefined) {
    packageToUpdate.thumbnailUrl = mediaData.thumbnailUrl;
  }

  if (mediaData.promoVideoUrl !== undefined) {
    packageToUpdate.promoVideoUrl = mediaData.promoVideoUrl;
  }

  const baseUrl = 'http://localhost:3000/uploads';

  // Only update fields if they are provided
  if (mediaData.cover_image !== undefined) {
    packageToUpdate.cover_image = `${baseUrl}/${mediaData.cover_image}`;
  }

  if (mediaData.thumbnailUrl !== undefined) {
    packageToUpdate.thumbnailUrl = `${baseUrl}/${mediaData.thumbnailUrl}`;
  }

  if (mediaData.promoVideoUrl !== undefined) {
    packageToUpdate.promoVideoUrl = `${baseUrl}/${mediaData.promoVideoUrl}`;
  }

  await this.packageRepository.save(packageToUpdate);

return {
  message: 'Package media updated successfully',
  data: {
    coverImage: packageToUpdate.cover_image ? `${baseUrl}/${packageToUpdate.cover_image}` : null,
    thumbnail: packageToUpdate.thumbnailUrl ? `${baseUrl}/${packageToUpdate.thumbnailUrl}` : null,
    promoVideo: packageToUpdate.promoVideoUrl ? `${baseUrl}/${packageToUpdate.promoVideoUrl}` : null,
  },
};

}



async getAllPackages(): Promise<Package[]> {
  return await this.packageRepository.find({
    relations: ['feeDetails', 'instructor'],
    order: { package_id: 'ASC' }, // optional
  });
}

async getPackagesByInstructor(instructorId: number): Promise<Package[]> {
  return await this.packageRepository.find({
    where: { instructor: { user_id: instructorId } }, // Filtering by instructor ID
    relations: ['instructor'], // Optional: If you want instructor details too
  });
}


async updatePackage(id: number, updatePackageDto: UpdatePackageDto): Promise<Package> {
  // Check if the package exists
  const existingPackage = await this.packageRepository.findOne({ where: { package_id: id } });

  if (!existingPackage) {
    throw new NotFoundException(`Package with ID ${id} not found`);
  }

  // Update the package details
  Object.assign(existingPackage, updatePackageDto);
  return await this.packageRepository.save(existingPackage);
}


async deletePackage(id: number): Promise<{ message: string }> {
  const packageToDelete = await this.packageRepository.findOne({ where: { package_id: id } });

  if (!packageToDelete) {
    throw new NotFoundException(`Package with ID ${id} not found`);
  }

  await this.packageRepository.remove(packageToDelete);
  return { message: `Package with ID ${id} has been deleted successfully` };
}

//getting  package by id
async getPackageDetails(packageId: string): Promise<Package | null> {
  return await this.packageRepository.findOne({
    where: { package_id: Number(packageId) }, 
    relations: ['feeDetails', 'instructor'],
  });
}

//publishing package

//get published packages
async getPublishedPackages(): Promise<Package[]> {
  return await this.packageRepository.find({
    where: { is_published: true },
    relations: ['feeDetails','instructor'], // include this if you want related fee details
  });
}



  /*
  async createPackage(packageData: Partial<Package>) {
    
    const newPackage = this.packageRepository.create(packageData);
    return await this.packageRepository.save(newPackage);
  }

  async addFee(fee: Partial<FeeDetails>) {
    
    const feeDetails = this.feeRepository.create(fee);
    return await this.feeRepository.save(feeDetails);
  }
*/



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

  // Update is_free in package table
  packageEntity.is_free = Number(updateData.total_fee) === 0;
  await this.packagesRepository.save(packageEntity);

  return await this.feeRepository.save(existingFee);
}


/*
async updateFeeDetails(id: number, updateFeeDto: UpdateFeeDto): Promise<FeeDetails> {
  const existingFee = await this.feeRepository.findOne({ where: { package: { package_id: id } } });

  if (!existingFee) {
    throw new NotFoundException(`Fee details for package ID ${id} not found`);
  }

  Object.assign(existingFee, updateFeeDto);
  return await this.feeRepository.save(existingFee);
}
*/
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




async getMediaDetails(packageId: number) {
  return this.packageRepository.findOne({
    where: { package_id: packageId },
    select: ['cover_image', 'thumbnailUrl', 'promoVideoUrl'],
  });
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





async addModule(modulePackageData: { module_id: number; module_type: ModuleType; package_id_array: number[] }): Promise<ModulePackage[]> {
  const savedModules: ModulePackage[] = [];

  for (const packageId of modulePackageData.package_id_array) {
  // Check if the package exists
  const packageExists = await this.packageRepository.findOne({ where: { package_id: packageId } });

  if (!packageExists) {
  console.warn(`Package with ID ${packageId} not found. Skipping...`);
  continue; // Skip this package if not found
  }

      const modulePackage = this.moduleRepository.create({
          module_id: modulePackageData.module_id,
          module_type: modulePackageData.module_type, // Ensure this is an enum
          package_id: packageId, // Storing package_id as a single value
      });

      const savedModule = await this.moduleRepository.save(modulePackage);
      savedModules.push(savedModule);
  }

  return savedModules; // Return all saved rows
}


async getModulePackage(module_id:number,module_type:ModuleType):Promise<{package_id:number,package_name:string}[]>{
  const modulePackages=await this.moduleRepository.find({
    where:{module_id,module_type},
    select:["package_id"],
  });
  if(!modulePackages.length){
    throw new NotFoundException("no pacakges for the given module")
  }
  const packageIds=modulePackages.map((mp)=>mp.package_id);

  const packages=await this.packageRepository.find({
    where:{package_id:In(packageIds)},
    select:["package_id","name"]
  });
  return packages.map((pkg)=>({
    package_id:pkg.package_id,
    package_name:pkg.name,
  }));


}

/*

  async addPromo(promoDetails:Partial<Promotion>){
    const promo=this.promoRepository.create(promoDetails);
    return this.promoRepository.save(promo);
  }

  async addAccess(accessDetails:Partial<PackageAccess>){
    const access=this.accessRepository.create(accessDetails);
    return this.accessRepository.save(access)
  }

  async addCommunity(communityDetails:Partial<Community>){
    const community=this.communityRepository.create(communityDetails);
    return this.communityRepository.save(community);
  }
  
  async addAssessment(assessmentDetails:Partial<Assessment>){
    const assessment=this.assessmentRepository.create(assessmentDetails);
    return this.assessmentRepository.save(assessment);

  }

  

  

    

  
*/
  

 
  
  
  
}


