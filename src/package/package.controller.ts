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
import { AnyFilesInterceptor, FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { UpdatePackageDto } from "./dtos/UpdatePackageDto.dto";
import { UpdateFeeDto } from "./dtos/updateFee.dto";
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { Category } from "./entities/categories.entity";
import { CreateBasicInfoDto } from "./dtos/basic-info.dto";
import {  Packages } from "./entities/packages.entity";
import { CreateIntendedLearnersDto } from "./dtos/create-intended-learners.dto";
import {  CreateCourseLandingPageDto } from "./dtos/course-landing-page-dto";
import { CourseLandingPage } from "./entities/course-landing-page.entities";


@Controller('package')
export class PackageController{
    constructor(private readonly packageService: PackageService) {}

    @Post('user')
    async createUser(@Body() userData:Partial<UserDetails>){
      console.log('User data received:', userData); // Log the incoming data
    return this.packageService.createUser(userData)
    }

   @Get('user/:id')
async getUserById(@Param('id') id: number) {
  const user = await this.packageService.getUserById(id);
  if (!user) {
    throw new NotFoundException(`User with id ${id} not found`);
  }
  return user;  // This will be sent as JSON to frontend
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

  @Post("basic-info")
  async createBasicInfo(@Body() createBasicInfoDto: CreateBasicInfoDto): Promise<{ packageId: number }> {
    const basicInfoEntity: Packages = await this.packageService.createBasicInfo(createBasicInfoDto);
    return { packageId: basicInfoEntity.package_id }; // Return the newly created BasicInfo ID
  }

 @Get('packages/:userId')
async getBasicInfoByUser(@Param('userId') userId: number) {
  return await this.packageService.getPackagesByUserId(userId);
}


  @Get(':packageId/package')  //getting whole details of a package by package id
async getPackageByPackageId(@Param('packageId') packageId: string) {
   const parsedId = parseInt(packageId, 10);

  if (isNaN(parsedId)) {
    throw new BadRequestException('Invalid packageId');
  }
  return this.packageService.getPackageByPackageId(parsedId);
}


@Delete(':packageId')
async deletePackage(@Param('packageId') packageId: number): Promise<{ message: string }> {
  await this.packageService.deletePackage(packageId);
  return { message: `Package for package ID ${packageId} deleted successfully.` };
}

@Patch(':packageId/publish')
async publishPackage(@Param('packageId') packageId: number) {
  const updated = await this.packageService.publishPackage(packageId);
  return { message: 'Package published successfully', data: updated };
}


@Patch(':packageId/complete-status')
updateCompleteStatus(@Param('packageId') id: number) {
  return this.packageService.updateCompleteStatus(id); // marks complete_status as true
}



 @Post(":packageId/intended-learners")
  async createIntendedLearners(
    @Param('packageId') packageId: string,
    @Body() createIntendedLearnersDto: CreateIntendedLearnersDto,
  ) {
    return this.packageService.createIntendedLearners(packageId, createIntendedLearnersDto);
  }

 @Get(":packageId/intended-learners")
async getIntendedLearners(@Param("packageId") packageId: string) {
  const packageIdAsNumber = Number(packageId);  // Convert string to number

  if (isNaN(packageIdAsNumber)) {
    throw new Error("Invalid package ID");
  }

  return this.packageService.getIntendedLearnersByPackageId(packageIdAsNumber);
}

// intended-learners.controller.ts
@Patch(':packageId/intended-learners')
async updateIntendedLearners(
  @Param('packageId') packageId: string,
  @Body() body: any,
) {
  return this.packageService.updateByPackageId(packageId, body);
}

@Post(':packageId/course-landing-page')
@UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'coverImage', maxCount: 1 },
        { name: 'thumbnailImage', maxCount: 1 },
        { name: 'videoFile', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const folder = {
              coverImage: 'uploads/course-landing-page/cover-image',
              thumbnailImage: 'uploads/course-landing-page/thumbnails',
              videoFile: 'uploads/course-landing-page/videos',
            }[file.fieldname] || 'uploads/others';

            cb(null, folder);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
      }
    ),
  )
  async createCourseLandingPage(
    @Param('packageId') packageId: number, // Capture packageId from URL params
    @Body() createDto: CreateCourseLandingPageDto,
    @UploadedFiles()
    files: {
      coverImage?: Express.Multer.File[];
      thumbnailImage?: Express.Multer.File[];
      videoFile?: Express.Multer.File[];
    },
  ) {
    // Pass packageId to the service along with the DTO and files
    return this.packageService.createCourseLandingPage(createDto, files, packageId);
  }

   @Get(':packageId/course-landing-page')
 async getCourseLandingPage(@Param("packageId") packageId: string) {
  const packageIdAsNumber = Number(packageId);  // Convert string to number

  if (isNaN(packageIdAsNumber)) {
    throw new Error("Invalid package ID");
  }

  return this.packageService.getCourseLandingPageByPackageId(packageIdAsNumber);
}

@Put(':packageId/course-landing-page')
 @UseInterceptors(
  FileFieldsInterceptor(
      [
        { name: 'coverImage', maxCount: 1 },
        { name: 'thumbnailImage', maxCount: 1 },
        { name: 'videoFile', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const folder = {
              coverImage: 'uploads/course-landing-page/cover-image',
              thumbnailImage: 'uploads/course-landing-page/thumbnails',
              videoFile: 'uploads/course-landing-page/videos',
            }[file.fieldname] || 'uploads/others';

            cb(null, folder);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
      }
    ),
)
async updateLandingPage(
  @Param('packageId') packageId: string,
  @UploadedFiles()
  files: {
    coverImage?: Express.Multer.File[];
    thumbnailImage?: Express.Multer.File[];
    videoFile?: Express.Multer.File[];
  },
  @Body() body: CreateCourseLandingPageDto,
) {
  
  return this.packageService.updateCourseLandingPage(+packageId, body, files);
}

@Post('price')
async addPrice(@Body() feeDetails: Partial<FeeDetails>) {
  
  
  if (!feeDetails.total_fee) {
    throw new BadRequestException('Total fee is required');
  }
  if (!feeDetails.packages || !feeDetails.packages.package_id) {
    throw new BadRequestException('Package ID is required');
  }

  return this.packageService.addFee(feeDetails);
}

@Get(':packageId/price')
async getFeeDetails(@Param('packageId') packageId: string) {
  const result = await this.packageService.getFeeDetailsByPackageId(packageId);

  return result;
}
@Put('price')
async updateFee(@Body() updateData: Partial<FeeDetails>) {
  console.log('[CONTROLLER] updateData received:', updateData);
  if (!updateData.packages?.package_id) {
    throw new BadRequestException('Package ID is required');
  }
console.log(updateData)
  return this.packageService.updateFeeDetails(updateData);
}

 @Delete(':packageId/price')
  async deleteFee(@Param('id', ParseIntPipe) id: number) {
    return this.packageService.deleteFeeByPackageId(id);
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
  
  @Post(':packageId/success-message')
async createContent(
  @Param('packageId', ParseIntPipe) packageId: number,
  @Body() body: { pageContent: string },
): Promise<{ message: string }> {
  return await this.packageService.createContent(packageId, body.pageContent);
}



  @Get(':packageId/success-message')
async getContent(@Param('packageId', ParseIntPipe) packageId: number) {
  const content = await this.packageService.findContent(packageId);
  return content;
}



   @Put(':packageId/success-message')
  async updateContent(
    @Param('packageId') packageId: string, // Package ID from URL
    @Body('pageContent') pageContent: string, // HTML content from request body
  ) {
    
    // Call the service to update the content
    return this.packageService.updateContent(packageId, pageContent);
  }

  @Delete(':packageId/success-message')
  async deleteContent(@Param('id') id: string): Promise<{ message: string }> {
    return this.packageService.deleteContent(id);
  }


   /* 
   /////////////////////////////////////////////////////////// remove from here
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
//////////////////////////////////////////////////////////////////////// remove from here
/*





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

  

 ///////////////////////////////////////////remove from here
 */

}