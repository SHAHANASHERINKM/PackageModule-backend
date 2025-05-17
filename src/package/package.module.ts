import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UserDetails } from "./entities/user.entity";
import { PackageController } from "./package.controller";
import { PackageService } from "./package.service";
import { Package } from "./entities/package.entity";
import { FeeDetails } from "./entities/fee.entities";
import { Promotion } from "./entities/promotion.entities";
import { PackageAccess } from "./entities/package-acess.entities";
import { Community } from "./entities/community.entities";
import { Assessment } from "./entities/assessment.entities";
import { ModulePackage } from "./entities/module_package.entity";
import { SuccessMessage } from "./entities/success-message.entities";
import { Category } from "./entities/categories.entity";
import { Packages } from "./entities/packages.entity";
import { IntendedLearners } from "./entities/intended-learners.entities";
import { Course } from "./entities/course.entity";
import { CourseLandingPage } from "./entities/course-landing-page.entities";

@Module({
    imports: [TypeOrmModule.forFeature([UserDetails,Package,FeeDetails,Promotion,PackageAccess,Community,Assessment,ModulePackage,
        SuccessMessage,Category,Packages,IntendedLearners,CourseLandingPage])],
    controllers: [PackageController],
    providers: [PackageService],
})

export class PackageModule{

}