import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Patch, Post, Put, UploadedFile, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { UserDetails } from "./entities/user.entity";
import { PackageService } from "./package.service";
import { Package } from "./entities/package.entity";
import { FeeDetails } from "./entities/fee.entities";
import { Promotion } from "./entities/promotion.entities";
import { PackageAccess } from "./entities/package-acess.entities";
import { Community } from "./entities/community.entities";
import { Assessment } from "./entities/assessment.entities";
import { ModulePackage, ModuleType } from "./entities/module_package.entity";
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { UpdatePackageDto } from "./dtos/UpdatePackageDto.dto";
import { UpdateFeeDto } from "./dtos/updateFee.dto";
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { Category } from "./entities/categories.entity";


@Controller('package')
export class PackageController{
    constructor(private readonly packageService: PackageService) {}

    @Post('user')
    async createUser(@Body() userData:Partial<UserDetails>){
      console.log('User data received:', userData); // Log the incoming data
    return this.packageService.createUser(userData)

    }

    @Post('login')
  async login(@Body('email') email: string) {
    if (!email) return { message: 'Email is required' };
    return this.packageService.loginWithEmail(email);
  }

  @Post("category")
  async create(@Body() body: any): Promise<Category> {
    const { categoryName } = body;

    if (!categoryName || categoryName.trim() === '') {
      throw new BadRequestException('categoryName is required');
    }

    return this.packageService.createCategory({ categoryName });
  }
    
    @Post('packages')
    @UseInterceptors(
        FileInterceptor('cover_image', {
          storage: diskStorage({
            destination: './uploads', // Folder where images are stored
            filename: (req, file, callback) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
              const ext = extname(file.originalname);
              callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
            },
          }),
        }),
      )
      async createPackage(
        @Body() packageData: any,
        @UploadedFile() file: Express.Multer.File,
      ) {
        try {
          return await this.packageService.createPackage(packageData, file);
        } catch (error) {
          console.error('Error in createPackage:', error);
          throw new BadRequestException(error.message || 'Failed to create package.');
        }
      }

      @Get('packages')
      async findAll() {
        const packages = await this.packageService.getAllPackages();
        //console.log(packages)
        return packages;
      }

      @Get('package/:id')
        async getPackageDetails(@Param('id') packageId: string) {
       const packageData = await this.packageService.getPackageDetails(packageId);
    
       //console.log('Fetched package data from service:', packageData); 
    
        if (!packageData) {
          throw new NotFoundException(`Package with ID ${packageId} not found`);
        }

        return { package: packageData };
      }


      @Put('package/:id')
      async updatePackage(
        @Param('id') id: string,
        @Body() updatePackageDto: UpdatePackageDto,
      ) {
        const numericId = parseInt(id, 10);
      
        if (isNaN(numericId)) {
          throw new NotFoundException('Invalid package ID');
        }
      
        // 🔍 Log the incoming data
        
      
        const updatedPackage = await this.packageService.updatePackage(numericId, updatePackageDto);
      
        return {
          message: 'Package updated successfully',
          data: updatedPackage,
        };
      }
      


  @Patch('packages/:id/publish')
  async publishPackage(@Param('id') id: number) {
    const updated = await this.packageService.publishPackage(id);
    return { message: 'Package published successfully', data: updated };
  }
  
  @Get('published')
async getPublishedPackages() {
  return this.packageService.getPublishedPackages(); 
}

    
//delete package
  @Delete(':id')
  async deletePackage(@Param('id') id: number) {
    return await this.packageService.deletePackage(id);
  }


  @Get(':id/media')
async getPackageMedia(@Param('id', ParseIntPipe) id: number) {
  const media = await this.packageService.getMediaDetails(id);
  if (!media) {
    throw new NotFoundException(`Package with ID ${id} not found`);
  }
  return media;
}

@Patch(':id/media')
@UseInterceptors(
  FileFieldsInterceptor(
    [
      { name: 'coverImage', maxCount: 1 },
      { name: 'thumbnail', maxCount: 1 },
      { name: 'promoVideo', maxCount: 1 },
    ],
    {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const ext = path.extname(file.originalname);
          const filename = `${uuidv4()}${ext}`;
          cb(null, filename);
        },
      }),
    },
  ),
)
async updatePackageMedia(
  @Param('id') id: string,
  @UploadedFiles()
  files: {
    coverImage?: Express.Multer.File[];
    thumbnail?: Express.Multer.File[];
    promoVideo?: Express.Multer.File[];
  },
) {
  console.log('Files received:', files);

  return this.packageService.updatePackageMedia(+id, {
    cover_image: files.coverImage?.[0]?.filename || undefined,
    thumbnailUrl: files.thumbnail?.[0]?.filename || undefined,
    promoVideoUrl: files.promoVideo?.[0]?.filename || undefined,
  });
}



      /*
      

     

    @Post('addPromo')
    async addPromo(@Body() promoDetails:Partial<Promotion>){
        return this.packageService.addPromo(promoDetails)

    }

    @Post('addAccess')
    async addAccess(@Body() accessDetails:Partial<PackageAccess>){
        return this.packageService.addAccess(accessDetails)
    }

    @Post('addCommunity')
    async addCommunity(@Body() commumityDetails:Partial<Community>){       
        return this.packageService.addCommunity(commumityDetails)
    }

    @Post('addAssessment')
    async addAssessment(@Body() assessmentDetails:Partial<Assessment>){
        return this.packageService.addAssessment(assessmentDetails)

    }

    

    @Get('getAllUsers')
    async getAllUsers(){
        return this.packageService.getAllUser();
    }

    @Get('getAllPackage')
    async getAllPackage(){
        return this.packageService.getAllPackage();
    }

    @Get('getPromo')
    async getPromo(){
        return this.packageService.getPromo();
    }

    @Get('getFee')
    async getFee(){
        return this.packageService.getFee();
    }

    @Get('feeWithPackage')
    async feeWithPackage(){
        return this.packageService.getFeewithPackage();
    }

    

    
    /*

    @Patch('package/:id')
    async updatePackage(@Param('id') packageId:number, @Body() packageData:Partial<Package>){
        return this.packageService.updatePackage(packageId,packageData);
    }

    @Patch('feeDetails/:id')
    async updateFee(@Param('id') feeId:number,@Body() feeData:Partial<FeeDetails>){
        return await this.packageService.updateFee(feeId,feeData)
    }
*/

@Post('fee')
async addFee(@Body() feeDetails: Partial<FeeDetails>) {
  if (!feeDetails.total_fee) {
    throw new BadRequestException('Total fee is required');
  }
  if (!feeDetails.package || !feeDetails.package.package_id) {
    throw new BadRequestException('Package ID is required');
  }

  return this.packageService.addFee(feeDetails);
}

@Get(':id/fee')
async getFeeDetails(@Param('id') packageId: string) {
  const packageData = await this.packageService.getPackageDetails(packageId);

  if (!packageData) {
    throw new NotFoundException(`Package with ID ${packageId} not found`);
  }

  if (packageData.is_free) {
    return {
      isFree: true,
      message: 'This package is free',
    };
  }

  const feeDetails = await this.packageService.getFeeDetailsByPackageId(packageId);

  if (!feeDetails) {
    throw new NotFoundException(`No fee details found for package ID ${packageId}`);
  }

  return {
    isFree: false,
    ...feeDetails,
  };
}



  @Put(':id/fee')
  async updateFeeDetails(
    @Param('id') id: string,
    @Body() updateFeeDto: UpdateFeeDto,
  ) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new NotFoundException('Invalid package ID');
    }
    const updatedFee=await this.packageService.updateFeeDetails(numericId, updateFeeDto);
    return {
      message: 'Fee Details updated successfully',
    data: updatedFee,
    }
  }

    @Delete('fee/:id')
  async deleteFee(@Param('id', ParseIntPipe) id: number) {
    return this.packageService.deleteFeeById(id);
  }

  @Post('success-images')
  @UseInterceptors(
    FileInterceptor('upload', {
      storage: diskStorage({
        destination: './uploads/success-page-images', // folder to save
        filename: (req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`;
          callback(null, uniqueSuffix);
        },
      }),
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      uploaded: true,
      url: `http://localhost:3000/uploads/success-page-images/${file.filename}`,
    };
  }



  @Post('success-message/:id')
  async createContent(
    @Param('id') id: string,
    @Body() body: { pageContent: string }, // Body contains the HTML content
  ): Promise<{ message: string }> {
    // Call the service to handle content creation and return the message
    return await this.packageService.createContent(id, body.pageContent);
  }

  @Get('success-message/:id')
  async getContent(@Param('id') id: string) {
  
    return this.packageService.findContent(id);
  }

  @Put('success-message/:id')
  async updateContent(
    @Param('id') id: string, // Package ID from URL
    @Body('pageContent') pageContent: string, // HTML content from request body
  ) {
    
    // Call the service to update the content
    return this.packageService.updateContent(id, pageContent);
  }

    
  /////MODULE
  @Post("module")
    async addModule(
        @Body() modulePackageData: { module_id: number; module_type: ModuleType; package_id_array: number[] }
    ): Promise<ModulePackage[]> {
        return this.packageService.addModule(modulePackageData);
    }
    
//PACKAGE BY INSTRUCTOR ID
@Get('instructor/:instructorId')
    async getPackagesByInstructor(@Param('instructorId') instructorId: number) {
      return this.packageService.getPackagesByInstructor(instructorId);
    }

    @Get("module/:module_id/:module_type")
    async getModulePackage(
    @Param("module_id") module_id: number,
    @Param("module_type") module_type: string
    ): Promise<{ package_id: number; package_name: string }[]> {
    // Convert module_type string to ModuleType enum
    const cleanedModuleType = module_type.trim() as ModuleType;
    return this.packageService.getModulePackage(Number(module_id), cleanedModuleType);
    }

  

 

}