import {getRequest} from "../api/ApiManager";
import {getEmployeesTeacher} from "../redux/features/employee/employeeSlice";
import {useDispatch} from "react-redux";

class EmployeeService {
    static getAllEmployees = async () => {
        const employeesListRequest: any = await getRequest(
            '',
            '/corebase/employees',
        );
        return employeesListRequest._embedded !== undefined
                ? employeesListRequest._embedded.employeeDTOModelList
                : [];
    };
    static getEmployeesProfession = async () => {
        const fonctionEmployeeReq: any = await getRequest(
            '',
            '/corebase/fonctions',
        );
        return fonctionEmployeeReq._embedded !== undefined
                ? fonctionEmployeeReq?._embedded?.fonctionDTOModelList
                : [];
    };
    static getChildClassEmployees = async (selectedChild: any) => {
        if (selectedChild.eleves.length > 0) {
            const employeesList: any = await EmployeeService.getAllEmployees();
            const fonctionEmployeeList: any = await EmployeeService.getEmployeesProfession();

            let teacherList: any = [];
            let employeeClassList: any = [];
            const employeeTempList: any = [];
            for (let i = 0; i < employeesList.length; i++) {
                const teacherClasses: any = employeesList[i]?.teacherClasses;
                if (teacherClasses.length > 0) {
                    if (teacherClasses[0] !== undefined) {
                        if (
                            teacherClasses[0]?.classeId ===
                            selectedChild?.eleves[0]?.classe?.id
                        ) {
                            teacherList.push(employeesList[i]);
                        }
                    }
                }

                //SORT TEACHER LIST
                teacherList = teacherList.sort(function (a: any, b: any) {
                    const firstName = a.person.nom.concat(a.person.prenom);
                    const secondName = b.person.nom.concat(b.person.prenom);
                    if (firstName < secondName) {
                        return -1;
                    }
                    if (firstName > secondName) {
                        return 1;
                    }
                    return 0;
                });

                const fonctionEmployee: any = employeesList[i]?.fonctions;
                if (fonctionEmployee.length > 0) {
                    if (fonctionEmployee[0] !== undefined) {
                        const fonctionFind = fonctionEmployeeList.find(
                            (job: any) => job.id === fonctionEmployee[0].fonctionId,
                        );
                        if (fonctionFind !== undefined) {
                            if (
                                fonctionFind.role === 'ADMIN' &&
                                employeesList[i].rdvChoosable
                            ) {
                                employeeTempList.push(employeesList[i]);
                            }
                        }
                    }
                }
            }

            employeeClassList = [...teacherList];
            //employeeClassList = [...employeeTempList, ...teacherList];
            //SORT EMPLOYEE LIST
            employeeClassList = employeeClassList.sort(function (
                a: any,
                b: any,
            ) {
                const firstName = a.person.nom.concat(a.person.prenom);
                const secondName = b.person.nom.concat(b.person.prenom);
                if (firstName < secondName) {
                    return -1;
                }
                if (firstName > secondName) {
                    return 1;
                }
                return 0;
            });

            const teacher = teacherList.length > 0 ? teacherList[0] : null;
            const teachersList = teacherList.length > 0 ? teacherList : [];
            const employeesClassList = employeeClassList.length > 0 ? employeeClassList : [];
            return {
                employees: employeesList,
                teacher: teacher,
                teacherList: teachersList,
                employeesClassList: employeesClassList,
            }
        }
        else {
            return {
                employees: [],
                teacher: null,
                teacherList: [],
                employeesClassList: [],
            }
        }
    };
}

export default EmployeeService;
