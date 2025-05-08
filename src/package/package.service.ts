import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeepPartial, In, Repository } from "typeorm";
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
  
    
  ) {}

  async createUser(userData: Partial<UserDetails>) {
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
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
async publishPackage(id: number): Promise<Package> {
  const pkg = await this.getPackageDetails(id.toString());

  if (!pkg) {
    throw new NotFoundException(`Package with ID ${id} not found`);
  }

  pkg.is_published = true;

  return await this.packageRepository.save(pkg); // This persists the change
}
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
async addFee(fee: Partial<FeeDetails>) {
  const {
    total_fee,
    discount_value,
    package: pkg,
    first_payment,
    recurring_amount,
    number_of_months,
    min_amount,
    ...rest
  } = fee;

  // Helper to safely parse numeric values or set them as null
  const safeNumber = (value: any): number | null => {
    return value === '' || value === undefined || value === null
      ? null
      : Number(value);
  };

  // Validate total_fee
  if (total_fee === undefined || total_fee === null || isNaN(Number(total_fee))) {
    throw new BadRequestException('Total fee is required and must be a valid number');
  }

  // Validate package ID
  if (!pkg || !pkg.package_id) {
    throw new BadRequestException('Package ID is required');
  }

  // Check if package exists
  const existingPackage = await this.packageRepository.findOne({
    where: { package_id: pkg.package_id },
  });

  if (!existingPackage) {
    throw new NotFoundException(`Package with ID ${pkg.package_id} not found`);
  }

  // Check if fee details already exist for this package
  const existingFee = await this.feeRepository.findOne({
    where: { package: { package_id: pkg.package_id } },
  });

  if (existingFee) {
    throw new ConflictException(`Fee details for package ID ${pkg.package_id} already exist`);
  }

  // Create FeeDetails entry
  const feeDetails = this.feeRepository.create({
    ...(rest as any),
    total_fee: Number(total_fee),
    first_payment: safeNumber(first_payment),
    discount_value: safeNumber(discount_value),
    recurring_amount: safeNumber(recurring_amount),
    number_of_months: safeNumber(number_of_months),
    min_amount: safeNumber(min_amount),
    package: existingPackage,
  } as DeepPartial<FeeDetails>);
  
  

  return await this.feeRepository.save(feeDetails);
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

async deleteFeeById(fee_id: number): Promise<{ message: string }> {
  const feeDetails = await this.feeRepository.findOne({ where: { fee_id } });

  if (!feeDetails) {
    throw new NotFoundException(`Fee details with ID ${fee_id} not found`);
  }

  await this.feeRepository.remove(feeDetails);
  return { message: `Fee details with ID ${fee_id} deleted successfully` };
}

async getFeeDetailsByPackageId(packageId: string): Promise<FeeDetails | null> {
  return await this.feeRepository
    .createQueryBuilder('feeDetails')
    .innerJoinAndSelect('feeDetails.package', 'package')
    .where('package.package_id = :packageId', { packageId })
    .getOne();
}

async updateFeeDetails(id: number, updateFeeDto: UpdateFeeDto): Promise<FeeDetails> {
  const existingFee = await this.feeRepository.findOne({ where: { package: { package_id: id } } });

  if (!existingFee) {
    throw new NotFoundException(`Fee details for package ID ${id} not found`);
  }

  Object.assign(existingFee, updateFeeDto);
  return await this.feeRepository.save(existingFee);
}

async createContent(id: string, pageContent: string): Promise<{ message: string }> {
  const existingContent = await this.successRepository.findOne({
    where: { packageId: Number(id) },
  });

  if (existingContent) {
    // Return a JSON response indicating the content already exists
    return { message: 'Content already exists for this package. Consider updating instead.' };
  }

  const newContent = this.successRepository.create({
    packageId: Number(id),
    pageContent,
  });

  await this.successRepository.save(newContent);

  // Return a JSON response for successful creation
  return { message: 'Success message created successfully.' };
}

async getMediaDetails(packageId: number) {
  return this.packageRepository.findOne({
    where: { package_id: packageId },
    select: ['cover_image', 'thumbnailUrl', 'promoVideoUrl'],
  });
}



async findContent(id: string): Promise<string | null> {
  const content = await this.successRepository.findOne({
    where: { packageId: Number(id) },
    select: ['pageContent'], // Only select the pageContent field
  });

  // Return the pageContent if it exists, otherwise return null
  return content ? content.pageContent : null;
}

async updateContent(id: string, pageContent: string): Promise<{ message: string }> {
  const existingContent = await this.successRepository.findOne({
    where: { packageId: Number(id) }, // Find by packageId
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


